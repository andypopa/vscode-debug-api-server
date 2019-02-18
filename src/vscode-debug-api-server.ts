import * as vscode from 'vscode';
import * as io from 'socket.io-client';
import AppServer from "./app/server";

export class VSCodeDebugAPIServer {
    debugSessionMapping:any = {};

    restartSession(debugSession: vscode.DebugSession): Thenable<boolean> {
        console.log('restarting', debugSession);
        return debugSession.customRequest('terminate').then((result) => {
            return vscode.debug.startDebugging(undefined, debugSession.configuration);
        });
    }

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