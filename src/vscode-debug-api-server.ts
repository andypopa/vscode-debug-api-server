import * as vscode from 'vscode';
import * as io from 'socket.io-client';
import AppServer from "./app/server";
import DebugConfigurationsService from "./services/debug-configurations.service";

export class VSCodeDebugAPIServer {
    debugSessionMapping:any = {};

    constructor() {
        try {
            const appServer = new AppServer();
            vscode.window.showInformationMessage('VSCode Debug API Server started.');
        } catch (e) {
            vscode.window.showInformationMessage('VSCode Debug API Server already running.');
        }

        const socket = io.connect('http://localhost:9696/');

        socket.on('restart', (debugSessionId:string) => {
            let debugSession = this.debugSessionMapping[debugSessionId];
            if (typeof debugSession === 'undefined') {
                console.log('not my debug session!', debugSessionId);
                return;
            }
            this.restartSession(debugSession);
        });

        socket.on('start', (workspaceFolder: string, debugConfigurationName: string) => {
            this.startSession(workspaceFolder, debugConfigurationName);
        });

        socket.on('add-debug-configuration', (workspaceFolder: string, debugConfiguration: any) => {
            DebugConfigurationsService.addDebugConfiguration(workspaceFolder, debugConfiguration);
        });

        socket.on('remove-debug-configuration', (workspaceFolder: string, debugConfigurationName: string) => {
            DebugConfigurationsService.removeDebugConfiguration(workspaceFolder, debugConfigurationName);
        });

        socket.on('request-debug-configurations', () => {
            socket.emit('emit-debug-configurations', DebugConfigurationsService.getDebugConfigurations());
        });

        vscode.debug.onDidStartDebugSession((debugSession: vscode.DebugSession) => {
            this.debugSessionMapping[debugSession.id] = debugSession;
            socket.emit('channel', 'push', debugSession);
        });

        vscode.debug.onDidTerminateDebugSession((debugSession: vscode.DebugSession) => {
            delete this.debugSessionMapping[debugSession.id];
            socket.emit('channel', 'remove', debugSession);
        });
    }
}