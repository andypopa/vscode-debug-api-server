import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as _ from 'lodash';

export default class DebugConfigurationsService {
    public static getDebugConfigurations() {
        let workspaceFoldersArr = vscode.workspace.workspaceFolders;
        if (typeof workspaceFoldersArr === 'undefined') {
            return [];
        } else {
            let debugConfigurations = _.flatten(workspaceFoldersArr
                .map((wsf) => wsf.uri.fsPath)
                .map(DebugConfigurationsService.getPotentialLaunchJsonPathForWorkspace)
                .filter(fs.existsSync)
                .map(DebugConfigurationsService.getDebugConfigurationsFromLaunchJson));
            console.log(debugConfigurations);
            return debugConfigurations;
        }
    }

    public static upsertDebugConfigurationInternal(workspaceFolder: string, debugConfiguration: any) {
        let launchJsonPath = DebugConfigurationsService.getPotentialLaunchJsonPathForWorkspace(workspaceFolder);
        let launchJsonData = DebugConfigurationsService.getLaunchJsonDataInternal(launchJsonPath);

        let maybeDebugConfigurationIndex = launchJsonData.configurations.findIndex((_debugConfiguration:any) => _debugConfiguration.name === debugConfiguration.name);
        if (maybeDebugConfigurationIndex === -1) {
            launchJsonData.configurations.push(debugConfiguration);
        } else {
            launchJsonData.configurations[maybeDebugConfigurationIndex] = debugConfiguration;
        }

        DebugConfigurationsService.updateLaunchJson(launchJsonPath, launchJsonData);
    }

    public static removeDebugConfigurationInternal(workspaceFolder: string, debugConfigurationName: any) {
        let launchJsonPath = DebugConfigurationsService.getPotentialLaunchJsonPathForWorkspace(workspaceFolder);
        let launchJsonData = DebugConfigurationsService.getLaunchJsonDataInternal(launchJsonPath);
        launchJsonData.configurations = launchJsonData.configurations.filter((debugConfiguration: any) => debugConfiguration.name !== debugConfigurationName);
        
        DebugConfigurationsService.updateLaunchJson(launchJsonPath, launchJsonData);
    }


    public static addDebugConfiguration(workspaceFolder: string, debugConfiguration: any) {
        if(!DebugConfigurationsService.isValidWorkspaceFolderWithLaunchJson(workspaceFolder)) {
            return;
        }

        DebugConfigurationsService.upsertDebugConfigurationInternal(workspaceFolder, debugConfiguration);
    }

    public static removeDebugConfiguration(workspaceFolder: string, debugConfigurationName: string) {
        if(!DebugConfigurationsService.isValidWorkspaceFolderWithLaunchJson(workspaceFolder)) {
            return;
        }

        DebugConfigurationsService.removeDebugConfigurationInternal(workspaceFolder, debugConfigurationName);
    }

    // DebugConfigurationsService
    public static getPotentialLaunchJsonPathForWorkspace(workspaceFolder: string) {
        return path.join(workspaceFolder, '.vscode', 'launch.json');
    }

    public static getLaunchJsonDataInternal(launchJsonPath: fs.PathLike) {
        try {
            let launchJsonData = JSON.parse(fs.readFileSync(launchJsonPath, 'utf8').replace(/\/\/(.*)/g, ''));
            return launchJsonData;
        } catch (err) {
            const message = `Couldn't parse ./vscode/launch.json: ${err}`;
            vscode.window.showErrorMessage(message)
            throw Error(message);
        }
    }

    public static isOpenWorkspaceFolder(workspaceFolder: string) {
        let workspaceFoldersArr = vscode.workspace.workspaceFolders;
        if (typeof workspaceFoldersArr === 'undefined') {
            return false;
        }
        return workspaceFoldersArr.some((wsf) => wsf.uri.fsPath === workspaceFolder);
    }

    public static isValidWorkspaceFolderWithLaunchJson(workspaceFolder: string) {
        if (!DebugConfigurationsService.isOpenWorkspaceFolder(workspaceFolder)) {
            return;
        }

        let potentialLaunchJsonPathForWorkspace = DebugConfigurationsService.getPotentialLaunchJsonPathForWorkspace(workspaceFolder);
        if (!DebugConfigurationsService.isValidLaunchJson(potentialLaunchJsonPathForWorkspace)) {
            return false;
        }
        return true;
    }

    public static isValidLaunchJson(launchJsonPath: string) {
        let isValid = true;

        try {
            DebugConfigurationsService.getDebugConfigurationsFromLaunchJsonInternal(launchJsonPath);
        } catch (err) {
            console.error(err);
            isValid = false;
        }

        return isValid;
    }

    public static getDebugConfigurationsFromLaunchJsonInternal(launchJsonPath: fs.PathLike) {
        let launchJsonData = DebugConfigurationsService.getLaunchJsonDataInternal(launchJsonPath);

        if (typeof launchJsonData !== undefined && 
            typeof launchJsonData.configurations !== 'undefined') {
            return launchJsonData.configurations;
        } else {
            const message = `Invalid launch.json: ${launchJsonPath}`;
            vscode.window.showErrorMessage(message)
            throw Error(message);
        }
    }

    public static getDebugConfigurationsFromLaunchJson(launchJsonPath: fs.PathLike) {
        try {
            return DebugConfigurationsService.getDebugConfigurationsFromLaunchJsonInternal(launchJsonPath) as vscode.DebugConfiguration[];
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    public static updateLaunchJson(launchJsonPath: fs.PathLike, launchJsonData: any) {
        fs.writeFileSync(launchJsonPath, JSON.stringify(launchJsonData, null, 4), 'utf8');
    }
}