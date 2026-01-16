
import * as vscode from 'vscode';
import { LogcatService } from '../services/LogcatService';
import { AdbDevice, LogcatSession, LogcatTag, LogcatTreeItem, TargetAppItem, SessionGroupItem, ControlAppItem, ControlActionItem, DumpsysGroupItem, ControlDeviceItem, ControlDeviceActionItem } from '../models/LogcatModels';


export class LogcatTreeProvider implements vscode.TreeDataProvider<LogcatTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<LogcatTreeItem | undefined | null | void> = new vscode.EventEmitter<LogcatTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<LogcatTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private devices: AdbDevice[] = [];
    private initialized = false;

    constructor(private logcatService: LogcatService) {
        this.logcatService.onDidChangeSessions(() => this.refresh());
    }

    public initialize() {
        // Kept for backward compatibility or manual refresh if needed, 
        // but getChildren handles lazy load now.
        if (!this.initialized) {
            this.refreshDevices();
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    async refreshDevices(): Promise<void> {
        this.devices = await this.logcatService.getDevices();
        this.initialized = true;
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
            item.iconPath = new vscode.ThemeIcon('multiple-windows');
            return item;
        } else if (this.isSession(element)) {
            const stateIcon = element.isRunning ? 'debug-stop' : 'play';
            const item = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.Expanded);
            item.description = element.isRunning ? '(Running)' : '';
            item.iconPath = new vscode.ThemeIcon(stateIcon);
            const timeContext = (element.useStartFromCurrentTime !== false) ? 't1' : 'full';
            const runContext = element.isRunning ? 'session_running' : 'session_stopped';
            item.contextValue = `${runContext}_${timeContext}`;

            const timeFilterStatus = (element.useStartFromCurrentTime !== false)
                ? "With history: none (Click icon to change)"
                : "With history: yes (Click icon to change)";
            item.tooltip = `${element.name}\nStatus: ${element.isRunning ? 'Running' : 'Stopped'}\n${timeFilterStatus}`;

            return item;
        } else if (this.isControlApp(element)) {
            const item = new vscode.TreeItem('Control app', vscode.TreeItemCollapsibleState.Expanded);
            item.contextValue = 'controlApp';
            item.iconPath = new vscode.ThemeIcon('tools');
            return item;
        } else if (this.isDumpsysGroup(element)) {
            const item = new vscode.TreeItem('Dumpsys', vscode.TreeItemCollapsibleState.Collapsed);
            item.contextValue = 'dumpsysGroup';
            item.iconPath = new vscode.ThemeIcon('output');
            return item;
        } else if (this.isControlAction(element)) {
            let label = '';
            let icon = '';
            let commandId = '';

            switch (element.actionType) {
                case 'uninstall':
                    label = 'Uninstall';
                    icon = 'trash';
                    commandId = 'logmagnifier.control.uninstall';
                    break;
                case 'clearStorage':
                    label = 'Clear storage';
                    icon = 'database';
                    commandId = 'logmagnifier.control.clearStorage';
                    break;
                case 'clearCache':
                    label = 'Clear cache';
                    icon = 'archive';
                    commandId = 'logmagnifier.control.clearCache';
                    break;
                case 'dumpsys':
                    label = 'Package';
                    icon = 'package';
                    commandId = 'logmagnifier.control.dumpsys';
                    break;
                case 'dumpsysMeminfo':
                    label = 'Meminfo';
                    icon = 'graph-line';
                    commandId = 'logmagnifier.control.dumpsysMeminfo';
                    break;
                case 'dumpsysActivity':
                    label = 'Activity';
                    icon = 'layers-active';
                    commandId = 'logmagnifier.control.dumpsysActivity';
                    break;
            }

            const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
            item.iconPath = new vscode.ThemeIcon(icon);
            item.contextValue = 'controlAction';
            item.command = {
                command: commandId,
                title: label,
                arguments: [element]
            };
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
        } else if (this.isControlDevice(element)) {
            const item = new vscode.TreeItem('Control device', vscode.TreeItemCollapsibleState.Collapsed);
            item.contextValue = 'controlDevice';
            item.iconPath = new vscode.ThemeIcon('tools');
            return item;
        } else if (this.isControlDeviceAction(element)) {
            if (element.actionType === 'screenshot') {
                const item = new vscode.TreeItem('Screenshot', vscode.TreeItemCollapsibleState.None);
                item.contextValue = 'controlDeviceAction';
                item.iconPath = new vscode.ThemeIcon('device-camera');
                item.command = {
                    command: 'logmagnifier.control.screenshot',
                    title: 'Screenshot',
                    arguments: [element]
                };
                return item;
            } else if (element.actionType === 'screenRecord') {
                const isRecording = this.logcatService.isDeviceRecording(element.device.id);
                const isStopping = this.logcatService.isDeviceStopping(element.device.id);

                let label = 'Screen Record';
                let icon = new vscode.ThemeIcon('record');
                let contextRaw = 'idle';
                let cmd: vscode.Command | undefined = {
                    command: 'logmagnifier.control.startScreenRecord',
                    title: 'Start Recording',
                    arguments: [element]
                };

                if (isStopping) {
                    label = 'Stopping recording...';
                    icon = new vscode.ThemeIcon('loading~spin');
                    contextRaw = 'stopping';
                    cmd = undefined; // Disable command while stopping
                } else if (isRecording) {
                    label = 'Recording... (Click to Stop)';
                    icon = new vscode.ThemeIcon('debug-stop');
                    contextRaw = 'recording';
                    cmd = {
                        command: 'logmagnifier.control.stopScreenRecord',
                        title: 'Stop Recording',
                        arguments: [element]
                    };
                }

                const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
                item.contextValue = `controlDeviceAction_record_${contextRaw}`;
                item.iconPath = icon;
                item.command = cmd;

                if (isStopping) {
                    item.tooltip = 'Finishing recording...';
                } else if (isRecording) {
                    item.tooltip = 'Recording in progress (Max 3 mins)';
                } else {
                    item.tooltip = 'Start screen recording (Max 3 mins)';
                }

                return item;
            } else if (element.actionType === 'showTouches') {
                const enabled = element.meta?.enabled === true;
                const label = enabled ? 'Show Touches: On' : 'Show Touches: Off';
                const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
                item.contextValue = enabled ? 'controlDeviceAction_showTouches_on' : 'controlDeviceAction_showTouches_off';

                item.iconPath = new vscode.ThemeIcon('target');

                item.command = {
                    command: 'logmagnifier.control.toggleShowTouches',
                    title: 'Toggle Show Touches',
                    arguments: [element]
                };
                item.tooltip = 'Toggle "Show Taps" in Developer Options';
                return item;
            }
        }

        return new vscode.TreeItem('Unknown');
    }

    getChildren(element?: LogcatTreeItem): vscode.ProviderResult<LogcatTreeItem[]> {
        if (!element) {
            if (!this.initialized) {
                this.initialized = true;
                return this.logcatService.getDevices().then(devices => {
                    this.devices = devices;
                    return this.devices;
                });
            }
            return this.devices;
        } else if (this.isDevice(element)) {
            // Return TargetApp, potentially ControlApp, ControlDevice, and SessionGroup
            const children: LogcatTreeItem[] = [
                { type: 'targetApp', device: element } as TargetAppItem
            ];

            // Control Device (New)
            children.push({ type: 'controlDevice', device: element } as ControlDeviceItem);

            if (element.targetApp && element.targetApp !== 'all') {
                children.push({ type: 'controlApp', device: element } as ControlAppItem);
            }

            children.push({ type: 'sessionGroup', device: element } as SessionGroupItem);
            return children;
        } else if (this.isControlApp(element)) {
            return [
                { type: 'controlAction', actionType: 'uninstall', device: element.device } as ControlActionItem,
                { type: 'controlAction', actionType: 'clearStorage', device: element.device } as ControlActionItem,
                { type: 'controlAction', actionType: 'clearCache', device: element.device } as ControlActionItem,
                { type: 'dumpsysGroup', device: element.device } as DumpsysGroupItem
            ];
        } else if (this.isDumpsysGroup(element)) {
            return [
                { type: 'controlAction', actionType: 'dumpsys', device: element.device } as ControlActionItem,
                { type: 'controlAction', actionType: 'dumpsysMeminfo', device: element.device } as ControlActionItem,
                { type: 'controlAction', actionType: 'dumpsysActivity', device: element.device } as ControlActionItem
            ];
        } else if (this.isControlDevice(element)) {
            return (async () => {
                const showTouchesState = await this.logcatService.getShowTouchesState(element.device.id);
                return [
                    { type: 'controlDeviceAction', actionType: 'screenshot', device: element.device } as ControlDeviceActionItem,
                    { type: 'controlDeviceAction', actionType: 'screenRecord', device: element.device } as ControlDeviceActionItem,
                    { type: 'controlDeviceAction', actionType: 'showTouches', device: element.device, meta: { enabled: showTouchesState } } as ControlDeviceActionItem
                ];
            })();
        } else if (this.isSessionGroup(element)) {
            return this.logcatService.getSessions().filter(s => s.device.id === element.device.id);
        } else if (this.isSession(element)) {
            return element.tags;
        }
        return [];
    }

    // Type guards
    private isDevice(element: LogcatTreeItem): element is AdbDevice {
        return 'id' in element && 'type' in element && 'model' in element && !('priority' in element) && !('tags' in element);
    }

    private isTargetApp(element: LogcatTreeItem): element is TargetAppItem {
        return 'type' in element && element.type === 'targetApp';
    }

    private isSessionGroup(element: LogcatTreeItem): element is SessionGroupItem {
        return 'type' in element && element.type === 'sessionGroup';
    }

    private isSession(element: LogcatTreeItem): element is LogcatSession {
        return 'tags' in element && 'device' in element && 'isRunning' in element;
    }

    private isTag(element: LogcatTreeItem): element is LogcatTag {
        return 'priority' in element && 'isEnabled' in element && 'name' in element;
    }

    private isControlApp(element: LogcatTreeItem): element is ControlAppItem {
        return 'type' in element && element.type === 'controlApp';
    }

    private isDumpsysGroup(element: LogcatTreeItem): element is DumpsysGroupItem {
        return 'type' in element && element.type === 'dumpsysGroup';
    }

    private isControlAction(element: LogcatTreeItem): element is ControlActionItem {
        return 'type' in element && element.type === 'controlAction';
    }

    private isControlDevice(element: LogcatTreeItem): element is ControlDeviceItem {
        return 'type' in element && element.type === 'controlDevice';
    }

    private isControlDeviceAction(element: LogcatTreeItem): element is ControlDeviceActionItem {
        return 'type' in element && element.type === 'controlDeviceAction';
    }
}
