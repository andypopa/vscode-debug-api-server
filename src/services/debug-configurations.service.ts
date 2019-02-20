import * as fs from 'fs';
import * as vscode from 'vscode';
import WorkspaceFolderService from './workspace-folder.service';

export default class DebugConfigurationsService {
    public static getDebugConfigurations() {
        let workspaceFoldersArr = vscode.workspace.workspaceFolders;
        if (typeof workspaceFoldersArr === 'undefined') {
            return [];
        } else {
            let debugConfigurations = workspaceFoldersArr
                .map((wsf) => wsf.uri.fsPath)
                .map(WorkspaceFolderService.getPotentialLaunchJsonPathForWorkspace)
                .filter(fs.existsSync)
                .map(WorkspaceFolderService.getDebugConfigurationsFromLaunchJson);
            console.log(debugConfigurations);
            return debugConfigurations;
        }
    }

    public static upsertDebugConfigurationInternal(workspaceFolder: string, debugConfiguration: any) {
        let launchJsonPath = WorkspaceFolderService.getPotentialLaunchJsonPathForWorkspace(workspaceFolder);
        let launchJsonData = WorkspaceFolderService.getLaunchJsonDataInternal(launchJsonPath);

        let maybeDebugConfigurationIndex = launchJsonData.configurations.findIndex((_debugConfiguration:any) => _debugConfiguration.name === debugConfiguration.name);
        if (maybeDebugConfigurationIndex === -1) {
            launchJsonData.configurations.push(debugConfiguration);
        } else {
            launchJsonData.configurations[maybeDebugConfigurationIndex] = debugConfiguration;
        }

        WorkspaceFolderService.updateLaunchJson(launchJsonPath, launchJsonData);
    }

    public static removeDebugConfigurationInternal(workspaceFolder: string, debugConfigurationName: any) {
        let launchJsonPath = WorkspaceFolderService.getPotentialLaunchJsonPathForWorkspace(workspaceFolder);
        let launchJsonData = WorkspaceFolderService.getLaunchJsonDataInternal(launchJsonPath);
        launchJsonData.configurations = launchJsonData.configurations.filter((debugConfiguration: any) => debugConfiguration.name !== debugConfigurationName);
        
        WorkspaceFolderService.updateLaunchJson(launchJsonPath, launchJsonData);
    }


    public static addDebugConfiguration(workspaceFolder: string, debugConfiguration: any) {
        if(!WorkspaceFolderService.isValidWorkspaceFolderWithLaunchJson(workspaceFolder)) {
            return;
        }

        this.upsertDebugConfigurationInternal(workspaceFolder, debugConfiguration);
    }

    public static removeDebugConfiguration(workspaceFolder: string, debugConfigurationName: string) {
        if(!WorkspaceFolderService.isValidWorkspaceFolderWithLaunchJson(workspaceFolder)) {
            return;
        }

        this.removeDebugConfigurationInternal(workspaceFolder, debugConfigurationName);
    }
}