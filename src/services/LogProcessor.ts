import * as vscode from 'vscode';
import * as fs from 'fs';
import * as readline from 'readline';
import { FilterGroup, FilterItem } from '../models/Filter';
import { RegexUtils } from '../utils/RegexUtils';


export interface CompiledGroup {
    includes: { regex: RegExp, contextLine: number }[];
    excludes: RegExp[];
}

const DEFAULT_MAX_BEFORE_LINES = 20; // Maximum supported context lines (9) + safety margin
const DEFAULT_MAX_LINE_COUNT = 999999;

export class LogProcessor {

    public compileGroups(activeGroups: FilterGroup[]): CompiledGroup[] {
        return activeGroups.map(group => ({
            includes: group.filters
                .filter(f => f.type === 'include' && f.isEnabled)
                .map(f => ({
                    regex: RegexUtils.create(f.keyword, !!f.isRegex, !!f.caseSensitive),
                    contextLine: f.contextLine ?? 0
                })),
            excludes: group.filters
                .filter(f => f.type === 'exclude' && f.isEnabled)
                .map(f => RegexUtils.create(f.keyword, !!f.isRegex, !!f.caseSensitive))
        }));
    }

    /**
     * Processes a log file and returns filtered lines.
     *
     * @param inputPath - Absolute path to the input log file
     * @param filterGroups - Array of filter groups to apply
     * @param options - Optional processing options
     * @param options.prependLineNumbers - Whether to prepend original line numbers
     * @param options.totalLineCount - Total number of lines for padding calculation
     * @returns Promise resolving to output path and statistics
     * @throws Error if file cannot be read or written
     */
    public async processFile(inputPath: string, filterGroups: FilterGroup[], options?: { prependLineNumbers?: boolean, totalLineCount?: number }): Promise<{ outputPath: string, processed: number, matched: number, lineMapping: number[] }> {
        const fileStream = fs.createReadStream(inputPath, { encoding: 'utf8' });

        fileStream.on('error', (err) => {
            console.error(`Error reading file ${inputPath}:`, err);
            // We can't really bubble this up easily since it's inside a promise that might be establishing the readline,
            // but readline should also error/close.
        });

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        rl.on('error', (err) => {
            console.error(`Readline error while processing ${inputPath}:`, err);
        });

        const activeGroups = filterGroups.filter(g => g.isEnabled);
        const compiledGroups = this.compileGroups(activeGroups);

        // Path and stream setup
        const os = require('os');
        const path = require('path');
        const tmpDir = os.tmpdir();
        const prefix = vscode.workspace.getConfiguration('logmagnifier').get<string>('tempFilePrefix') || 'filtered_';
        const now = new Date();
        const outputFilename = `${prefix}${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}.log`;
        const outputPath = path.join(tmpDir, outputFilename);
        const outputStream = fs.createWriteStream(outputPath);

        let processed = 0;
        let matched = 0;

        const maxBeforeLines = DEFAULT_MAX_BEFORE_LINES;
        const beforeBuffer: { line: string, index: number }[] = [];
        let afterLinesRemaining = 0;
        let lastWrittenLineIndex = -1; // Index of the last line written to output

        // Line Mapping: Index = Output Line Number, Value = Source Line Number
        const lineMapping: number[] = [];
        let outputLineCounter = 0;

        // Padding calculation
        const prependLineNumbers = options?.prependLineNumbers || false;
        const totalLineCount = options?.totalLineCount || DEFAULT_MAX_LINE_COUNT;
        const padding = totalLineCount.toString().length;

        const formatLine = (line: string, index: number) => {
            if (prependLineNumbers) {
                return `${index.toString().padStart(padding, '0')}: ${line}`;
            }
            return line;
        };

        const writeLine = (line: string, originalIndex: number) => {
            if (!outputStream.write(formatLine(line, originalIndex) + '\n')) {
                // We could await drain here, but for simplicity in this synchronous-like wrapper, we rely on stream buffering
                // or extensive async handling. The original code had async drain logic.
                // We'll keep it simple or re-integrate if needed.
                // Actually, original code had `await new Promise...`. We need to handle that.
                return false;
            }
            lineMapping.push(originalIndex);
            outputLineCounter++;
            return true;
        };

        try {
            for await (const line of rl) {
                processed++; // 1-based index for display, but 0-based for logic often? 
                // Wait, processed matches `index` in formatLine, which is passed as `processed`.
                // Let's stick to the existing convention: processed is 1-based index of Current Line.
                const currentLineIndex = processed - 1; // 0-based index for mapping

                const matchResult = this.checkMatchCompiled(line, compiledGroups);

                if (matchResult.isMatched) {
                    matched++;
                    const maxContext = matchResult.contextLines;

                    // 1. Write 'Before' context lines that haven't been written yet
                    const startIndex = Math.max(0, beforeBuffer.length - maxContext);
                    const linesToSubmit = beforeBuffer.slice(startIndex);

                    for (let i = 0; i < linesToSubmit.length; i++) {
                        const bufferedItem = linesToSubmit[i];
                        if (bufferedItem.index > lastWrittenLineIndex) {
                            if (!writeLine(bufferedItem.line, bufferedItem.index)) {
                                await new Promise<void>(resolve => outputStream.once('drain', () => resolve()));
                            }
                            lastWrittenLineIndex = bufferedItem.index;
                        }
                    }

                    // 2. Write current matching line
                    if (processed > lastWrittenLineIndex) {
                        if (!writeLine(line, processed)) {
                            await new Promise<void>(resolve => outputStream.once('drain', () => resolve()));
                        }
                        lastWrittenLineIndex = processed;
                    }

                    // 3. Set/Update 'After' context counter
                    afterLinesRemaining = Math.max(afterLinesRemaining, maxContext);
                } else if (afterLinesRemaining > 0) {
                    // This is an 'After' context line
                    if (processed > lastWrittenLineIndex) {
                        if (!writeLine(line, processed)) {
                            await new Promise<void>(resolve => outputStream.once('drain', () => resolve()));
                        }
                        lastWrittenLineIndex = processed;
                    }
                    afterLinesRemaining--;
                }

                // Maintain before buffer
                beforeBuffer.push({ line, index: processed });
                if (beforeBuffer.length > maxBeforeLines) {
                    beforeBuffer.shift();
                }
            }
        } finally {
            outputStream.end();
            await new Promise<void>(resolve => outputStream.on('finish', () => resolve()));
        }

        // Adjust mapping to be 0-based for VS Code Positions
        // currently `lineMapping` stores 1-based line numbers from `processed`.
        // We should convert them to 0-based.
        const adjustedMapping = lineMapping.map(l => l - 1);

        return { outputPath, processed, matched, lineMapping: adjustedMapping };
    }

    /**
     * Checks if a line matches filters using pre-compiled regex groups.
     */
    public checkMatchCompiled(line: string, compiledGroups: CompiledGroup[]): { isMatched: boolean, contextLines: number } {
        let maxContext = 0;
        let anyIncludeDefined = false;
        let matchFound = false;

        if (compiledGroups.length === 0) {
            return { isMatched: false, contextLines: 0 };
        }

        for (const group of compiledGroups) {
            // Excludes: Highest priority. If ANY active group excludes the line, it's out.
            for (const excludeRegex of group.excludes) {
                excludeRegex.lastIndex = 0; // Reset state for global regex
                if (excludeRegex.test(line)) {
                    return { isMatched: false, contextLines: 0 };
                }
            }

            // Includes: OR logic between groups. 
            // If any group has include filters, we enter "include mode".
            if (group.includes.length > 0) {
                anyIncludeDefined = true;
                for (const include of group.includes) {
                    include.regex.lastIndex = 0; // Reset state for global regex
                    if (include.regex.test(line)) {
                        matchFound = true;
                        maxContext = Math.max(maxContext, include.contextLine);
                    }
                }
            }
        }

        // Final determination: 
        // 1. If no include filters are defined anywhere, we include everything (that wasn't excluded).
        // 2. If include filters are defined, we only include if at least ONE matched.
        const isMatched = !anyIncludeDefined || matchFound;

        return { isMatched, contextLines: maxContext };
    }

    /**
     * Checks if a line matches filters and returns the required context lines.
     * Legacy method: Wrapper around checkMatchCompiled for backward compatibility.
     */
    public checkMatch(line: string, groups: FilterGroup[]): { isMatched: boolean, contextLines: number } {
        // Optimization: if we are calling this in a loop for many lines, it's better to use checkMatchCompiled
        // with pre-compiled groups.
        const activeGroups = groups.filter(g => g.isEnabled);
        const compiled = this.compileGroups(activeGroups);
        return this.checkMatchCompiled(line, compiled);
    }

}
