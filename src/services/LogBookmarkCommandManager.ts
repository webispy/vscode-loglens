import * as vscode from 'vscode';
import { LogBookmarkService } from './LogBookmarkService';
import { BookmarkItem } from '../models/Bookmark';
import { HighlightService } from './HighlightService';
import { Constants } from '../constants';

export class LogBookmarkCommandManager {
    constructor(
        context: vscode.ExtensionContext,
        private bookmarkService: LogBookmarkService,
        private highlightService: HighlightService
    ) {
        this.registerCommands(context);
    }

    private registerCommands(context: vscode.ExtensionContext) {
        context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.AddBookmark, () => this.addBookmark()));
        context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.RemoveBookmark, (item: BookmarkItem) => this.removeBookmark(item)));
        context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.JumpToBookmark, (item: BookmarkItem) => this.jumpToBookmark(item)));
    }

    private addBookmark() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const line = editor.selection.active.line;
            this.bookmarkService.addBookmark(editor, line);
        }
    }

    private removeBookmark(item: BookmarkItem) {
        if (item) {
            this.bookmarkService.removeBookmark(item);
        }
    }

    private async jumpToBookmark(item: BookmarkItem) {
        if (!item) { return; }
        try {
            const doc = await vscode.workspace.openTextDocument(item.uri);
            const editor = await vscode.window.showTextDocument(doc, { preview: true });
            const range = new vscode.Range(item.line, 0, item.line, 0);
            editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
            editor.selection = new vscode.Selection(range.start, range.start);
            this.highlightService.flashLine(editor, item.line, Constants.Configuration.Bookmark.HighlightColor);
        } catch (e) {
            vscode.window.showErrorMessage(`Failed to open bookmark: ${e}`);
        }
    }
}
