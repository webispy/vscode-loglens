import * as vscode from 'vscode';
import { LogBookmarkService } from '../services/LogBookmarkService';
import { BookmarkItem } from '../models/Bookmark';

export class LogBookmarkWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _bookmarkService: LogBookmarkService
    ) {
        this._bookmarkService.onDidChangeBookmarks(() => {
            this.updateContent();
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'jump':
                    this.jumpToBookmark(data.item);
                    break;
                case 'remove':
                    this.removeBookmark(data.item);
                    break;
            }
        });

        this.updateContent();
    }

    private jumpToBookmark(item: any) {
        // Hydrate URI
        const hydratedItem: BookmarkItem = {
            ...item,
            uri: vscode.Uri.parse(item.uriString)
        };
        vscode.commands.executeCommand('logmagnifier.jumpToBookmark', hydratedItem);
    }

    private removeBookmark(item: any) {
        // Hydrate URI
        const hydratedItem: BookmarkItem = {
            ...item,
            uri: vscode.Uri.parse(item.uriString)
        };
        vscode.commands.executeCommand('logmagnifier.removeBookmark', hydratedItem);
    }

    private updateContent() {
        if (!this._view) {
            return;
        }

        const html = this.getHtmlForWebview(this._view.webview);
        this._view.webview.html = html;
    }

    private getHtmlForWebview(webview: vscode.Webview) {
        const bookmarks = this._bookmarkService.getBookmarks();

        // Prepare data map for client-side
        const itemsMap: Record<string, any> = {};

        let fileGroups = '';

        for (const [uriStr, items] of bookmarks) {
            const uri = vscode.Uri.parse(uriStr);
            const filename = uri.path.split('/').pop();
            // Removed manual zero-padding logic as CSS handles alignment

            let fileLines = '';
            for (const item of items) {
                const paddedLine = (item.line + 1).toString();

                // Escape HTML in content for display ONLY
                const safeContent = item.content.replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");

                // Store raw item data in map
                const safeItem = {
                    id: item.id,
                    line: item.line,
                    content: item.content,
                    uriString: item.uri.toString()
                };
                itemsMap[item.id] = safeItem;

                // Flattened structure (Table): log-line (row) > gutter (cell) + line-content (cell)
                // Changed line-content from span to div for better table-cell behavior
                fileLines += `<div class="log-line" onclick="jumpTo('${item.id}')"><div class="gutter"><div class="gutter-content"><span class="remove-btn" onclick="removeBookmark('${item.id}')" title="Remove Bookmark">×</span><span class="line-number">${paddedLine}</span></div></div><div class="line-content">${safeContent}</div></div>`;
            }

            fileGroups += `<div class="file-group"><div class="file-header">${filename}</div><div class="file-content"><div class="lines-inner">${fileLines}</div></div></div>`;
        }

        if (bookmarks.size === 0) {
            fileGroups = '<div class="empty-state">No bookmarks yet. Right-click on a line in an editor and select "Add line to LogMagnifier bookmark".</div>';
        }

        // Serialize the full map to inject into the script
        const serializedMap = JSON.stringify(itemsMap);

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Log Bookmarks</title>
                <style>
                    body {
                        font-family: var(--vscode-editor-font-family, 'Courier New', monospace);
                        font-size: var(--vscode-editor-font-size, 12px);
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        padding: 0;
                        margin: 0;
                    }
                    .file-group {
                        margin-bottom: 0px;
                        display: flex;
                        flex-direction: column;
                    }
                    .file-header {
                        font-family: var(--vscode-font-family, sans-serif);
                        font-size: 11px;
                        font-weight: bold;
                        color: var(--vscode-sideBarTitle-foreground);
                        background-color: var(--vscode-sideBar-background);
                        opacity: 1.0;
                        padding: 4px 10px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        display: flex;
                        align-items: center;
                    }
                    .file-content {
                        display: block;
                        overflow-x: auto;
                    }
                    .lines-inner {
                        /* Table layout enforces strictest width alignment */
                        display: table;
                        width: 100%; /* Will expand if content forces it */
                        border-collapse: collapse; /* For border rendering */
                    }
                    .log-line {
                        display: table-row;
                        line-height: 18px;
                        cursor: pointer;
                        /* border-bottom on tr is tricky, handled by cells */
                    }
                    .log-line:hover {
                        background-color: var(--vscode-list-hoverBackground);
                    }
 s
                    /* Unified Sticky Gutter */
                    .gutter {
                        display: table-cell;
                        position: sticky;
                        left: 0;
                        z-index: 10;
                        vertical-align: top;
                        background-color: var(--vscode-editor-background);
                        border-right: 1px solid var(--vscode-editorRuler-foreground);
                        padding: 0; /* Clear internal padding */
                        width: 1px; /* Shrink to fit content */
                        white-space: nowrap;
                    }
                    /* Needs internal wrapper for flex alignment inside the cell if needed,
                       but we remove flex from gutter to act as pure cell */
                    .log-line:hover .gutter {
                        background-color: var(--vscode-list-hoverBackground);
                    }

                    .gutter-content {
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        height: 100%;
                    }

                    .remove-btn {
                        display: inline-block; /* Inline inside table cell gutter */
                        vertical-align: middle;
                        cursor: pointer;
                        color: transparent;
                        width: 20px;
                        text-align: center;
                        font-size: 14px;
                        transition: color 0.1s;
                        height: 18px;
                        line-height: 18px;
                        user-select: none; /* Prevent copying */
                    }
                    .log-line:hover .remove-btn {
                        color: var(--vscode-icon-foreground);
                    }
                    .remove-btn:hover {
                        color: var(--vscode-errorForeground) !important;
                    }

                    .line-number {
                        display: inline-block; /* Inline inside table cell gutter */
                        vertical-align: middle;
                        color: var(--vscode-editorLineNumber-foreground);
                        min-width: 40px;
                        text-align: right;
                        padding-right: 15px;
                        user-select: none;
                        height: 18px;
                        line-height: 18px;
                    }

                    .line-content {
                        display: table-cell;
                        vertical-align: top;
                        color: var(--vscode-editor-foreground);
                        padding-left: 10px;
                        padding-right: 10px;
                        white-space: pre;
                        font-family: inherit;
                        tab-size: 4;
                        z-index: 0;
                        width: 100%;
                    }

                    .empty-state {
                        color: var(--vscode-descriptionForeground);
                        padding: 20px;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                ${fileGroups}
                <script>
                    const vscode = acquireVsCodeApi();
                    const itemsMap = ${serializedMap};

                    function jumpTo(id) {
                         const item = itemsMap[id];
                         if (item) {
                             vscode.postMessage({ type: 'jump', item: item });
                         }
                    }
                    function removeBookmark(id) {
                         const item = itemsMap[id];
                         if (item) {
                             vscode.postMessage({ type: 'remove', item: item });
                         }
                         // Prevent bubbling to jump
                         event.stopPropagation();
                    }
                </script>
            </body>
            </html>`;
    }
}
