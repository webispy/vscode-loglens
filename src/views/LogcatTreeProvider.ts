
import * as vscode from 'vscode';
import { LogcatService } from '../services/LogcatService';
import { AdbDevice, LogcatSession, LogcatTag, LogcatTreeItem, TargetAppItem, SessionGroupItem } from '../models/LogcatModels';


export class LogcatTreeProvider implements vscode.TreeDataProvider<LogcatTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<LogcatTreeItem | undefined | null | void> = new vscode.EventEmitter<LogcatTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<LogcatTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private devices: AdbDevice[] = [];

    constructor(private logcatService: LogcatService) {
        this.logcatService.onDidChangeSessions(() => this.refresh());
        this.refreshDevices();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    async refreshDevices(): Promise<void> {
        this.devices = await this.logcatService.getDevices();
        this.refresh();
    }

    getTreeItem(element: LogcatTreeItem): vscode.TreeItem {
        if (this.isDevice(element)) {
            const item = new vscode.TreeItem(`${element.model || 'Unknown'} (${element.id})`, vscode.TreeItemCollapsibleState.Expanded);
            item.description = element.type;
            item.iconPath = new vscode.ThemeIcon('device-mobile');
            item.contextValue = 'device';
            return item;
        } else if (this.isTargetApp(element)) {
            const app = element.device.targetApp || 'all';
            const item = new vscode.TreeItem(`Target app: ${app}`, vscode.TreeItemCollapsibleState.None);
            item.iconPath = new vscode.ThemeIcon('symbol-method');
            item.command = {
                command: 'logmagnifier.pickTargetApp',
                title: 'Select Target App',
                arguments: [element]
            };
            item.tooltip = 'Click to select target application';
            return item;
        } else if (this.isSessionGroup(element)) {
            const item = new vscode.TreeItem('Logcat Sessions', vscode.TreeItemCollapsibleState.Expanded);
            item.contextValue = 'sessionGroup';
            // Find if there are any sessions to maybe affect icon? No need.
            return item;
        } else if (this.isSession(element)) {
            const stateIcon = element.isRunning ? 'debug-stop' : 'play';
            const item = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.Expanded);
            item.description = element.isRunning ? '(Running)' : '';
            item.iconPath = new vscode.ThemeIcon(stateIcon);
            item.contextValue = element.isRunning ? 'session_running' : 'session_stopped';
            return item;
        } else if (this.isTag(element)) {
            const item = new vscode.TreeItem(`${element.name}:${element.priority}`, vscode.TreeItemCollapsibleState.None);
            item.iconPath = new vscode.ThemeIcon('tag');

            // Find parent session
            const session = this.logcatService.getSessions().find(s => s.tags.includes(element));
            if (session && session.isRunning) {
                item.contextValue = 'tag_readonly';
                item.description = '(Locked)';
            } else {
                item.contextValue = 'tag_editable';
            }
            return item;
        }
        return new vscode.TreeItem('Unknown');
    }

    getChildren(element?: LogcatTreeItem): vscode.ProviderResult<LogcatTreeItem[]> {
        if (!element) {
            return this.devices;
        } else if (this.isDevice(element)) {
            // Return TargetApp and SessionGroup
            return [
                { type: 'targetApp', device: element } as TargetAppItem,
                { type: 'sessionGroup', device: element } as SessionGroupItem
            ];
        } else if (this.isSessionGroup(element)) {
            return this.logcatService.getSessions().filter(s => s.device.id === element.device.id);
        } else if (this.isSession(element)) {
            return element.tags;
        }
        return [];
    }

    // Type guards
    private isDevice(element: LogcatTreeItem): element is AdbDevice {
        return (element as any).id !== undefined && (element as any).type !== 'targetApp' && (element as any).type !== 'sessionGroup' && (element as any).priority === undefined && (element as any).tags === undefined;
    }

    private isTargetApp(element: LogcatTreeItem): element is TargetAppItem {
        return (element as any).type === 'targetApp';
    }

    private isSessionGroup(element: LogcatTreeItem): element is SessionGroupItem {
        return (element as any).type === 'sessionGroup';
    }

    private isSession(element: LogcatTreeItem): element is LogcatSession {
        return (element as LogcatSession).tags !== undefined && (element as LogcatSession).device !== undefined;
    }

    private isTag(element: LogcatTreeItem): element is LogcatTag {
        return (element as LogcatTag).priority !== undefined && (element as LogcatTag).isEnabled !== undefined;
    }
}
