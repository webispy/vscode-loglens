
import * as vscode from 'vscode';
import { LogcatService } from './LogcatService';
import { LogcatTreeProvider } from '../views/LogcatTreeProvider';
import { AdbDevice, LogcatSession, LogcatTag, LogPriority } from '../models/LogcatModels';
import * as crypto from 'crypto';

export class LogcatCommandManager {
    constructor(
        private context: vscode.ExtensionContext,
        private logcatService: LogcatService,
        private treeProvider: LogcatTreeProvider
    ) {
        this.registerCommands();
    }

    private registerCommands() {
        this.context.subscriptions.push(vscode.commands.registerCommand('logmagnifier.refreshDevices', async () => {
            await this.treeProvider.refreshDevices();
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand('logmagnifier.addLogcatSession', async (arg: any) => {
            let device: AdbDevice | undefined;
            if (arg.type === 'sessionGroup') {
                device = arg.device;
            } else {
                device = arg as AdbDevice; // Fallback or direct device call
            }

            if (!device) { return; }
            const name = await vscode.window.showInputBox({
                prompt: 'Enter Session Name',
                placeHolder: 'My App Debug'
            });
            if (name) {
                this.logcatService.createSession(name, device);
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand('logmagnifier.startLogcatSession', async (session: LogcatSession) => {
            if (session) {
                await this.logcatService.startSession(session.id);
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand('logmagnifier.stopLogcatSession', async (session: LogcatSession) => {
            if (session) {
                this.logcatService.stopSession(session.id);
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand('logmagnifier.removeLogcatSession', async (session: LogcatSession) => {
            if (session) {
                if (session.isRunning) {
                    this.logcatService.stopSession(session.id);
                }
                this.logcatService.removeSession(session.id);
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand('logmagnifier.addLogcatTag', async (session: LogcatSession) => {
            if (!session) { return; }

            // Input format: Tag:Priority or just Tag
            const input = await vscode.window.showInputBox({
                prompt: 'Enter Tag and Priority (e.g. MyApp:D)',
                placeHolder: 'Tag:Priority'
            });

            if (input) {
                const tag = this.parseTagInput(input);
                if (tag) {
                    this.logcatService.addTag(session.id, tag);
                } else {
                    vscode.window.showErrorMessage('Invalid Tag format. Use "Tag" or "Tag:Priority" (V, D, I, W, E, F, S)');
                }
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand('logmagnifier.editLogcatTag', async (tag: LogcatTag) => {
            // Context resolution might be tricky if "tag" object doesn't have parent session info easily available.
            // But validation logic "viewItem == tag_editable" ensures we only call this when valid.
            // However, we need the sessionId to update it.
            // We can find the session by tag.
            const session = this.logcatService.getSessions().find(s => s.tags.find(t => t.id === tag.id));
            if (!session) { return; }

            const current = `${tag.name}:${tag.priority}`;
            const input = await vscode.window.showInputBox({
                prompt: 'Edit Tag',
                value: current
            });

            if (input) {
                const newTag = this.parseTagInput(input);
                if (newTag) {
                    // Update existing tag id
                    newTag.id = tag.id;
                    newTag.isEnabled = tag.isEnabled;
                    this.logcatService.updateTag(session.id, newTag);
                }
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand('logmagnifier.removeLogcatTag', async (tag: LogcatTag) => {
            const session = this.logcatService.getSessions().find(s => s.tags.find(t => t.id === tag.id));
            if (!session) { return; }
            this.logcatService.removeTag(session.id, tag.id);
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand('logmagnifier.pickTargetApp', async (item: any) => {
            // item is TargetAppItem
            const device = item.device;
            if (!device) { return; }

            const runningApps = await this.logcatService.getRunningApps(device.id);
            const thirdPartyPackages = await this.logcatService.getThirdPartyPackages(device.id);

            const quickPickItems: vscode.QuickPickItem[] = [];

            // 1st: 'all'
            quickPickItems.push({
                label: 'all',
                description: 'Show all logs'
            });

            const userRunning: vscode.QuickPickItem[] = [];
            const systemRunning: vscode.QuickPickItem[] = [];

            runningApps.forEach(pkg => {
                if (thirdPartyPackages.has(pkg)) {
                    userRunning.push({
                        label: pkg,
                        description: '(running)'
                    });
                } else {
                    systemRunning.push({
                        label: pkg,
                        description: '(running)'
                    });
                }
            });

            // Sort
            userRunning.sort((a, b) => a.label.localeCompare(b.label));
            systemRunning.sort((a, b) => a.label.localeCompare(b.label));

            // 2nd: Installed and 3rd-party packages with running apps(A-Z)
            if (userRunning.length > 0) {
                quickPickItems.push({
                    label: 'User Apps (3rd-Party)',
                    kind: vscode.QuickPickItemKind.Separator
                });
                quickPickItems.push(...userRunning);
            }

            // 3rd: Installed and Running apps (A-Z) - System
            if (systemRunning.length > 0) {
                quickPickItems.push({
                    label: 'System Apps',
                    kind: vscode.QuickPickItemKind.Separator
                });
                quickPickItems.push(...systemRunning);
            }

            const picked = await vscode.window.showQuickPick(quickPickItems, {
                placeHolder: 'Select Target Application (filters by PID)',
                matchOnDetail: true
            });

            if (picked) {
                this.logcatService.setTargetApp(device, picked.label);
            }
        }));
    }

    private parseTagInput(input: string): LogcatTag | undefined {
        const parts = input.split(':');
        const name = parts[0].trim();
        if (!name) { return undefined; }

        let priority = LogPriority.Verbose; // Default
        if (parts.length > 1) {
            const p = parts[1].trim().toUpperCase();
            if (Object.values(LogPriority).includes(p as LogPriority)) {
                priority = p as LogPriority;
            } else {
                return undefined; // Invalid priority
            }
        }

        return {
            id: crypto.randomUUID(),
            name,
            priority,
            isEnabled: true
        };
    }
}
