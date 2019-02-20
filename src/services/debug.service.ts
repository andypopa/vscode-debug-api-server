import * as vscode from 'vscode';
import DebugConfigurationsService from './debug-configurations.service';

export default class DebugService {
    public static startSession(workspaceFolder: string, debugConfigurationName: string): void {
        let debugConfigurations = DebugConfigurationsService.getDebugConfigurations();
        let maybeDebugConfigurationToStartIndex = debugConfigurations.findIndex((debugConfiguration: any) => debugConfiguration.name === debugConfigurationName);

        if (maybeDebugConfigurationToStartIndex === -1) {
            return;
        }

        let debugConfiguration = debugConfigurations[maybeDebugConfigurationToStartIndex];

        vscode.debug.startDebugging(undefined, debugConfiguration);
    }

    public static restartSession(debugSession: vscode.DebugSession): Thenable<boolean> {
        console.log('restarting', debugSession);
        return debugSession.customRequest('terminate').then((result) => {
            return vscode.debug.startDebugging(undefined, debugSession.configuration);
        });
    }
}