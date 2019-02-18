import * as vscode from 'vscode';
import { VSCodeDebugAPIServer } from './vscode-debug-api-server';

export function activate(context: vscode.ExtensionContext) {
	const vsCodeDebugAPIServer = new VSCodeDebugAPIServer();
}

export function deactivate() {}
