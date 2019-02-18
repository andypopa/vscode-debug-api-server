import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage('Hello World!');

	const startDebugHandler = (event:vscode.DebugSession) => {
		vscode.window.showInformationMessage(JSON.stringify(event));

	}

	vscode.debug.onDidStartDebugSession(startDebugHandler);
}

export function deactivate() {}
