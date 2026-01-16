
import * as vscode from 'vscode';
import { LogcatService } from './LogcatService';
import { LogcatTreeProvider } from '../views/LogcatTreeProvider';
import { AdbDevice, LogcatSession, LogcatTag, LogPriority, ControlActionItem, ControlDeviceActionItem } from '../models/LogcatModels';
import * as crypto from 'crypto';
import { Constants } from '../constants';

export class LogcatCommandManager {
    constructor(
        private context: vscode.ExtensionContext,
        private logcatService: LogcatService,
        private treeProvider: LogcatTreeProvider
    ) {
        this.registerCommands();
    }

    private registerCommands() {
        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.RefreshDevices, async () => {
            await this.treeProvider.refreshDevices();
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.AddLogcatSession, async (arg: any) => {
            let device: AdbDevice | undefined;
            if (arg.type === 'sessionGroup') {
                device = arg.device;
            } else {
                device = arg as AdbDevice; // Fallback or direct device call
            }

            if (!device) { return; }
            const existingSessions = this.logcatService.getSessions();
            const defaultName = `Session ${existingSessions.length + 1}`;

            const name = await vscode.window.showInputBox({
                prompt: Constants.Prompts.EnterSessionName,
                placeHolder: Constants.PlaceHolders.SessionName,
                value: defaultName,
                valueSelection: [0, defaultName.length]
            });
            if (name) {
                this.logcatService.createSession(name, device);
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.StartLogcatSession, async (session: LogcatSession) => {
            if (session) {
                await this.logcatService.startSession(session.id);
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.StopLogcatSession, async (session: LogcatSession) => {
            if (session) {
                this.logcatService.stopSession(session.id);
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.RemoveLogcatSession, async (session: LogcatSession) => {
            if (session) {
                if (session.isRunning) {
                    this.logcatService.stopSession(session.id);
                }
                this.logcatService.removeSession(session.id);
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.SessionEnableTimeFilter, async (session: LogcatSession) => {
            if (session) {
                this.logcatService.toggleSessionTimeFilter(session.id);
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.SessionDisableTimeFilter, async (session: LogcatSession) => {
            if (session) {
                this.logcatService.toggleSessionTimeFilter(session.id);
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.AddLogcatTag, async (session: LogcatSession) => {
            if (!session) { return; }

            // Input format: Tag:Priority or just Tag
            const input = await vscode.window.showInputBox({
                prompt: Constants.Prompts.EnterTagTimestamp,
                placeHolder: Constants.PlaceHolders.TagFormat
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

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.EditLogcatTag, async (tag: LogcatTag) => {
            // Context resolution might be tricky if "tag" object doesn't have parent session info easily available.
            // But validation logic "viewItem == tag_editable" ensures we only call this when valid.
            // However, we need the sessionId to update it.
            // We can find the session by tag.
            const session = this.logcatService.getSessions().find(s => s.tags.find(t => t.id === tag.id));
            if (!session) { return; }

            const current = `${tag.name}:${tag.priority}`;
            const input = await vscode.window.showInputBox({
                prompt: Constants.Prompts.EditTag,
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

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.RemoveLogcatTag, async (tag: LogcatTag) => {
            const session = this.logcatService.getSessions().find(s => s.tags.find(t => t.id === tag.id));
            if (!session) { return; }
            this.logcatService.removeTag(session.id, tag.id);
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.PickTargetApp, async (item: any) => {
            // item is TargetAppItem
            const device = item.device;
            if (!device) { return; }

            const runningApps = await this.logcatService.getRunningApps(device.id);
            const thirdPartyPackages = await this.logcatService.getThirdPartyPackages(device.id);

            const quickPickItems: vscode.QuickPickItem[] = [];

            // 1st: 'all'
            quickPickItems.push({
                label: Constants.Labels.All,
                description: Constants.Labels.ShowAllLogs
            });

            const userRunning: vscode.QuickPickItem[] = [];
            const systemRunning: vscode.QuickPickItem[] = [];

            runningApps.forEach(pkg => {
                if (thirdPartyPackages.has(pkg)) {
                    userRunning.push({
                        label: pkg,
                        description: Constants.Labels.Running
                    });
                } else {
                    systemRunning.push({
                        label: pkg,
                        description: Constants.Labels.Running
                    });
                }
            });

            // Sort
            userRunning.sort((a, b) => a.label.localeCompare(b.label));
            systemRunning.sort((a, b) => a.label.localeCompare(b.label));

            // 2nd: Installed and 3rd-party packages with running apps(A-Z)
            if (userRunning.length > 0) {
                quickPickItems.push({
                    label: Constants.Labels.UserApps,
                    kind: vscode.QuickPickItemKind.Separator
                });
                quickPickItems.push(...userRunning);
            }

            // 3rd: Installed and Running apps (A-Z) - System
            if (systemRunning.length > 0) {
                quickPickItems.push({
                    label: Constants.Labels.SystemApps,
                    kind: vscode.QuickPickItemKind.Separator
                });
                quickPickItems.push(...systemRunning);
            }

            const picked = await vscode.window.showQuickPick(quickPickItems, {
                placeHolder: Constants.PlaceHolders.SelectTargetApp,
                matchOnDetail: true
            });

            if (picked) {
                this.logcatService.setTargetApp(device, picked.label);
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.ControlUninstall, async (item: ControlActionItem) => {
            if (item && item.device && item.device.targetApp) {
                const answer = await vscode.window.showWarningMessage(
                    Constants.Prompts.UninstallConfirm.replace('{0}', item.device.targetApp),
                    'Yes', 'No'
                );
                if (answer !== 'Yes') { return; }

                const success = await this.logcatService.uninstallApp(item.device.id, item.device.targetApp);
                if (success) {
                    vscode.window.showInformationMessage('Uninstall completed. Please refresh the device list.');
                    this.treeProvider.refreshDevices(); // Proactive refresh
                } else {
                    vscode.window.showErrorMessage('Uninstall failed.');
                }
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.ControlClearStorage, async (item: ControlActionItem) => {
            if (item && item.device && item.device.targetApp) {
                const answer = await vscode.window.showWarningMessage(
                    Constants.Prompts.ClearStorageConfirm.replace('{0}', item.device.targetApp),
                    'Yes', 'No'
                );
                if (answer !== 'Yes') { return; }

                const success = await this.logcatService.clearAppStorage(item.device.id, item.device.targetApp);
                if (success) {
                    vscode.window.showInformationMessage('Clear storage completed. Please refresh if needed.');
                } else {
                    vscode.window.showErrorMessage('Clear storage failed.');
                }
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.ControlClearCache, async (item: ControlActionItem) => {
            if (item && item.device && item.device.targetApp) {
                const success = await this.logcatService.clearAppCache(item.device.id, item.device.targetApp);
                // Clear cache might not return "Success" explicitly in stdout so we trust the boolean Result
                if (success) {
                    vscode.window.showInformationMessage('Clear cache completed. Please refresh if needed.');
                } else {
                    vscode.window.showErrorMessage('Clear cache failed (App might need to be debuggable).');
                }
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.ControlDumpsys, async (item: ControlActionItem) => {
            if (item && item.device && item.device.targetApp) {
                try {
                    const result = await this.logcatService.runDumpsysPackage(item.device.id, item.device.targetApp);
                    if (result) {
                        // Create a URI with a unique title: "Dumpsys pkg: <package> (<HMS>)"
                        const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
                        const uri = vscode.Uri.from({ scheme: 'untitled', path: `Dumpsys pkg: ${item.device.targetApp} (${timestamp})` });
                        const doc = await vscode.workspace.openTextDocument(uri);

                        // Replace content
                        const edit = new vscode.WorkspaceEdit();
                        const fullRange = new vscode.Range(
                            doc.positionAt(0),
                            doc.positionAt(doc.getText().length)
                        );
                        edit.replace(uri, fullRange, result);
                        await vscode.workspace.applyEdit(edit);

                        await vscode.window.showTextDocument(doc);
                    } else {
                        vscode.window.showErrorMessage('Dumpsys returned no output.');
                    }
                } catch (e: any) {
                    vscode.window.showErrorMessage(`Dumpsys failed: ${e.message}`);
                }
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.ControlDumpsysMeminfo, async (item: ControlActionItem) => {
            if (item && item.device && item.device.targetApp) {
                try {
                    const result = await this.logcatService.runDumpsysMeminfo(item.device.id, item.device.targetApp);
                    if (result) {
                        // Create a URI with a unique title: "Dumpsys mem: <package> (<HMS>)"
                        const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
                        const uri = vscode.Uri.from({ scheme: 'untitled', path: `Dumpsys mem: ${item.device.targetApp} (${timestamp})` });
                        const doc = await vscode.workspace.openTextDocument(uri);

                        // Replace content
                        const edit = new vscode.WorkspaceEdit();
                        const fullRange = new vscode.Range(
                            doc.positionAt(0),
                            doc.positionAt(doc.getText().length)
                        );
                        edit.replace(uri, fullRange, result);
                        await vscode.workspace.applyEdit(edit);

                        await vscode.window.showTextDocument(doc);
                    } else {
                        vscode.window.showErrorMessage('Dumpsys meminfo returned no output.');
                    }
                } catch (e: any) {
                    vscode.window.showErrorMessage(`Dumpsys meminfo failed: ${e.message}`);
                }
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.ControlDumpsysActivity, async (item: ControlActionItem) => {
            if (item && item.device && item.device.targetApp) {
                try {
                    const result = await this.logcatService.runDumpsysActivity(item.device.id, item.device.targetApp);
                    if (result) {
                        // Create a URI with a unique title: "Dumpsys act: <package> (<HMS>)"
                        const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
                        const uri = vscode.Uri.from({ scheme: 'untitled', path: `Dumpsys act: ${item.device.targetApp} (${timestamp})` });
                        const doc = await vscode.workspace.openTextDocument(uri);

                        // Replace content
                        const edit = new vscode.WorkspaceEdit();
                        const fullRange = new vscode.Range(
                            doc.positionAt(0),
                            doc.positionAt(doc.getText().length)
                        );
                        edit.replace(uri, fullRange, result);
                        await vscode.workspace.applyEdit(edit);

                        await vscode.window.showTextDocument(doc);
                    } else {
                        vscode.window.showErrorMessage('Dumpsys activity returned no output.');
                    }
                } catch (e: any) {
                    vscode.window.showErrorMessage(`Dumpsys activity failed: ${e.message}`);
                }
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.ControlScreenshot, async (item: ControlDeviceActionItem) => {
            if (item && item.device) {
                const os = require('os');
                const path = require('path');
                const tmpDir = os.tmpdir();
                // Format: screenshot_YYYYMMDD_HHMMSS.png
                const now = new Date();
                const filename = `screenshot_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}.png`;
                const localPath = path.join(tmpDir, filename);

                const success = await this.logcatService.captureScreenshot(item.device.id, localPath);
                if (success) {
                    // Open the image
                    const uri = vscode.Uri.file(localPath);
                    await vscode.commands.executeCommand('vscode.open', uri);
                } else {
                    vscode.window.showErrorMessage('Screenshot capture failed.');
                }
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.ControlStartScreenRecord, async (item: ControlDeviceActionItem) => {
            if (item && item.device) {
                const success = await this.logcatService.startRecording(item.device.id);
                if (success) {
                    vscode.window.showInformationMessage('Recording started... (Max 3 mins)');
                }
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.ControlStopScreenRecord, async (item: ControlDeviceActionItem) => {
            if (item && item.device) {
                await this.logcatService.stopRecording(item.device.id);
            }
        }));

        this.context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.ControlToggleShowTouches, async (item: ControlDeviceActionItem) => {
            if (item && item.device) {
                await this.logcatService.toggleShowTouches(item.device.id);
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
