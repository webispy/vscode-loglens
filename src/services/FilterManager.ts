import * as vscode from 'vscode';
import { FilterGroup, FilterItem, FilterType } from '../models/Filter';
import { Logger } from './Logger';

// Solarized-inspired and distinct colors for highlights
export interface ColorPreset {
    id: string; // color1 ~ color16
    dark: string;
    light: string;
}

// Default color presets if configuration is missing
const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
    { id: 'color01', dark: 'rgba(255, 50, 50, 0.5)', light: 'rgba(255, 50, 50, 0.4)' },      // Bright Red
    { id: 'color02', dark: 'rgba(0, 180, 180, 0.5)', light: 'rgba(0, 180, 180, 0.4)' },      // Dark Cyan
    { id: 'color03', dark: 'rgba(255, 220, 0, 0.5)', light: 'rgba(255, 220, 0, 0.4)' },      // Gold
    { id: 'color04', dark: 'rgba(100, 50, 255, 0.5)', light: 'rgba(100, 50, 255, 0.4)' },    // Blue Violet
    { id: 'color05', dark: 'rgba(255, 140, 0, 0.5)', light: 'rgba(255, 140, 0, 0.4)' },      // Dark Orange
    { id: 'color06', dark: 'rgba(0, 200, 0, 0.5)', light: 'rgba(0, 200, 0, 0.4)' },          // Pure Green
    { id: 'color07', dark: 'rgba(255, 0, 100, 0.5)', light: 'rgba(255, 0, 100, 0.4)' },      // Deep Pink
    { id: 'color08', dark: 'rgba(100, 150, 255, 0.5)', light: 'rgba(100, 150, 255, 0.4)' },  // Cornflower Blue
    { id: 'color09', dark: 'rgba(200, 200, 0, 0.5)', light: 'rgba(200, 200, 0, 0.4)' },      // Olive
    { id: 'color10', dark: 'rgba(200, 0, 200, 0.5)', light: 'rgba(200, 0, 200, 0.4)' },     // Magenta
    { id: 'color11', dark: 'rgba(0, 255, 200, 0.5)', light: 'rgba(0, 255, 200, 0.4)' },     // Aqua
    { id: 'color12', dark: 'rgba(255, 100, 0, 0.5)', light: 'rgba(255, 100, 0, 0.4)' },     // Orange Red
    { id: 'color13', dark: 'rgba(0, 100, 255, 0.5)', light: 'rgba(0, 100, 255, 0.4)' },     // Royal Blue
    { id: 'color14', dark: 'rgba(100, 255, 100, 0.5)', light: 'rgba(100, 255, 100, 0.4)' }, // Light Green
    { id: 'color15', dark: 'rgba(180, 100, 255, 0.5)', light: 'rgba(180, 100, 255, 0.4)' }, // Medium Purple
    { id: 'color16', dark: 'rgba(255, 100, 150, 0.5)', light: 'rgba(255, 100, 150, 0.4)' }  // Pink Salmon
];

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export class FilterManager {
    private groups: FilterGroup[] = [];
    private colorPresets: ColorPreset[] = [];
    private _onDidChangeFilters: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangeFilters: vscode.Event<void> = this._onDidChangeFilters.event;

    private _onDidChangeResultCounts: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangeResultCounts: vscode.Event<void> = this._onDidChangeResultCounts.event;

    private logger: Logger;

    constructor() {
        this.logger = Logger.getInstance();
        this.loadColorPresets();
        this.initDefaultFilters();

        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('logmagnifier.highlightColors')) {
                this.loadColorPresets();
                this._onDidChangeFilters.fire();
            }
        });
    }

    private loadColorPresets() {
        const config = vscode.workspace.getConfiguration('logmagnifier.highlightColors');
        const presets: ColorPreset[] = [];

        for (let i = 1; i <= 16; i++) {
            const id = `color${i.toString().padStart(2, '0')}`;
            const configId = `color${i.toString().padStart(2, '0')}`;
            const colorConfig = config.get<{ dark: string, light: string }>(configId);
            if (colorConfig) {
                presets.push({
                    id,
                    dark: colorConfig.dark,
                    light: colorConfig.light
                });
            }
        }

        if (presets.length > 0) {
            this.colorPresets = presets;
        } else {
            this.colorPresets = DEFAULT_COLOR_PRESETS;
        }
    }

    private initDefaultFilters(): void {
        const featuredGroup = this.addGroup('Presets', true);
        if (!featuredGroup) {
            return;
        }
        featuredGroup.isEnabled = false;

        this.addFilter(
            featuredGroup.id,
            '^\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2}\\.\\d{3}',
            'include',
            true,
            'Logcat style'
        );

        this.addFilter(
            featuredGroup.id,
            '^\\s*\\d+\\s+\\d+\\s+[a-zA-Z_]\\S*\\s+\\S+\\s+-?\\d+',
            'include',
            true,
            'Process Info'
        );
    }

    public getGroups(): FilterGroup[] {
        return this.groups;
    }

    public getAvailableColors(): string[] {
        return this.colorPresets.map(p => p.id);
    }

    public getColorPresets(): ColorPreset[] {
        return this.colorPresets;
    }

    public getPresetById(id: string): ColorPreset | undefined {
        return this.colorPresets.find(p => p.id === id);
    }

    public addGroup(name: string, isRegex: boolean = false): FilterGroup | undefined {
        const exists = this.groups.some(g => g.name.toLowerCase() === name.toLowerCase() && !!g.isRegex === !!isRegex);
        if (exists) {
            return undefined;
        }

        const newGroup: FilterGroup = {
            id: generateId(),
            name,
            filters: [],
            isEnabled: false,
            isRegex
        };
        this.groups.push(newGroup);
        this.logger.info(`Filter group added: ${name} (Regex: ${isRegex})`);
        this._onDidChangeFilters.fire();
        return newGroup;
    }

    public addFilter(groupId: string, keyword: string, type: FilterType, isRegex: boolean = false, nickname?: string): FilterItem | undefined {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            const exists = group.filters.some(f => {
                if (isRegex) {
                    return f.keyword === keyword && f.nickname === nickname;
                }
                return f.keyword.toLowerCase() === keyword.toLowerCase() && f.type === type;
            });

            if (exists) {
                return undefined;
            }

            const newFilter: FilterItem = {
                id: generateId(),
                keyword,
                type,
                isEnabled: true,
                isRegex,
                nickname,
                color: (!isRegex && type === 'include') ? this.assignColor(group) : undefined,
                contextLine: 0
            };
            group.filters.push(newFilter);
            this.logger.info(`Filter added to group '${group.name}': ${keyword} (Type: ${type}, Regex: ${isRegex})`);
            this._onDidChangeFilters.fire();
            return newFilter;
        }
        return undefined;
    }

    private assignColor(group: FilterGroup): string {
        const usedColors = new Set(
            group.filters
                .filter(f => f.color)
                .map(f => f.color)
        );

        // Find first unused color
        const availableColor = this.colorPresets.find(c => !usedColors.has(c.id));
        if (availableColor) {
            return availableColor.id;
        }

        // If all used, pick random from presets
        return this.colorPresets[Math.floor(Math.random() * this.colorPresets.length)].id;
    }

    public updateFilterColor(groupId: string, filterId: string, color: string): void {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            const filter = group.filters.find(f => f.id === filterId);
            if (filter) {
                filter.color = color;
                this._onDidChangeFilters.fire();
            }
        }
    }

    public toggleFilterHighlightMode(groupId: string, filterId: string): void {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            const filter = group.filters.find(f => f.id === filterId);
            if (filter) {
                // If it was the old boolean flag, migrate it
                if (filter.highlightMode === undefined) {
                    filter.highlightMode = (filter as any).enableFullLineHighlight ? 1 : 0;
                    delete (filter as any).enableFullLineHighlight;
                }

                // Cycle: 0 (Word) -> 1 (Line) -> 2 (Whole Line) -> 0
                filter.highlightMode = (filter.highlightMode + 1) % 3;
                this._onDidChangeFilters.fire();
            }
        }
    }

    public toggleFilterCaseSensitivity(groupId: string, filterId: string): void {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            const filter = group.filters.find(f => f.id === filterId);
            if (filter) {
                filter.caseSensitive = !filter.caseSensitive;
                this._onDidChangeFilters.fire();
            }
        }
    }

    public toggleFilterContextLine(groupId: string, filterId: string): void {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            const filter = group.filters.find(f => f.id === filterId);
            if (filter) {
                const levels = [0, 3, 5, 9];
                const currentIndex = levels.indexOf(filter.contextLine ?? 0);
                const nextIndex = (currentIndex + 1) % levels.length;
                filter.contextLine = levels[nextIndex];
                this._onDidChangeFilters.fire();
            }
        }
    }

    public removeFilter(groupId: string, filterId: string): void {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.filters = group.filters.filter(f => f.id !== filterId);
            this.logger.info(`Filter removed from group '${group.name}': ${filterId}`);
            this._onDidChangeFilters.fire();
        }
    }

    public removeGroup(groupId: string): void {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            this.groups = this.groups.filter(g => g.id !== groupId);
            this.logger.info(`Filter group removed: ${group.name}`);
            this._onDidChangeFilters.fire();
        }
    }

    public toggleGroup(groupId: string): void {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.isEnabled = !group.isEnabled;
            this.logger.info(`Filter group '${group.name}' ${group.isEnabled ? 'enabled' : 'disabled'}`);
            this._onDidChangeFilters.fire();
        }
    }

    public toggleFilter(groupId: string, filterId: string): void {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            const filter = group.filters.find(f => f.id === filterId);
            if (filter) {
                filter.isEnabled = !filter.isEnabled;
                this.logger.info(`Filter '${filter.keyword}' in group '${group.name}' ${filter.isEnabled ? 'enabled' : 'disabled'}`);
                this._onDidChangeFilters.fire();
            }
        }
    }

    public moveFilter(groupId: string, activeFilterId: string, targetFilterId: string, position: 'before' | 'after'): void {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            const activeIndex = group.filters.findIndex(f => f.id === activeFilterId);
            const targetIndex = group.filters.findIndex(f => f.id === targetFilterId);

            if (activeIndex !== -1 && targetIndex !== -1 && activeIndex !== targetIndex) {
                const [activeFilter] = group.filters.splice(activeIndex, 1);

                // If we removed an item before the target, the target index shifts down by 1
                let newTargetIndex = group.filters.findIndex(f => f.id === targetFilterId);

                if (position === 'after') {
                    newTargetIndex++;
                }

                group.filters.splice(newTargetIndex, 0, activeFilter);
                this._onDidChangeFilters.fire();
            }
        }
    }

    public updateResultCounts(counts: { filterId: string, count: number }[], groupCounts: { groupId: string, count: number }[]): void {
        let changed = false;
        for (const group of this.groups) {
            const gCount = groupCounts.find(c => c.groupId === group.id);
            if (gCount !== undefined && group.resultCount !== gCount.count) {
                group.resultCount = gCount.count;
                changed = true;
            }

            for (const filter of group.filters) {
                const fCount = counts.find(c => c.filterId === filter.id);
                if (fCount !== undefined && filter.resultCount !== fCount.count) {
                    filter.resultCount = fCount.count;
                    changed = true;
                }
            }
        }

        if (changed) {
            this._onDidChangeResultCounts.fire();
        }
    }
}
