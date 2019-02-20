import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export default class WorkspaceFolderService {
    public static getPotentialLaunchJsonPathForWorkspace(workspaceFolder: string) {
        return path.join(workspaceFolder, '.vscode', 'launch.json');
    }

    public static getLaunchJsonDataInternal(launchJsonPath: fs.PathLike) {
        let launchJsonData = JSON.parse(fs.readFileSync(launchJsonPath, 'utf8').replace(/\/\/(.*)/g, ''));
        return launchJsonData;
    }

    public static isOpenWorkspaceFolder(workspaceFolder: string) {
        let workspaceFoldersArr = vscode.workspace.workspaceFolders;
        if (typeof workspaceFoldersArr === 'undefined') {
            return false;
        }
        return workspaceFoldersArr.some((wsf) => wsf.uri.fsPath === workspaceFolder);
    }

    public static isValidWorkspaceFolderWithLaunchJson(workspaceFolder: string) {
        if (!this.isOpenWorkspaceFolder(workspaceFolder)) {
            return;
        }

        let potentialLaunchJsonPathForWorkspace = this.getPotentialLaunchJsonPathForWorkspace(workspaceFolder);
        if (!this.isValidLaunchJson(potentialLaunchJsonPathForWorkspace)) {
            return false;
        }
        return true;
    }

    public static isValidLaunchJson(launchJsonPath: string) {
        let isValid = true;

        try {
            this.getDebugConfigurationsFromLaunchJsonInternal(launchJsonPath);
        } catch (err) {
            console.error(err);
            isValid = false;
        }

        return isValid;
    }

    public static getDebugConfigurationsFromLaunchJsonInternal(launchJsonPath: fs.PathLike) {
        let launchJsonData = WorkspaceFolderService.getLaunchJsonDataInternal(launchJsonPath);

        if (typeof launchJsonData !== undefined && 
            typeof launchJsonData.configurations !== 'undefined') {
            return launchJsonData.configurations;
        } else {
            throw Error(`Invalid launch.json: ${launchJsonPath}`);
        }
    }

    public static getDebugConfigurationsFromLaunchJson(launchJsonPath: fs.PathLike) {
        try {
            return this.getDebugConfigurationsFromLaunchJsonInternal(launchJsonPath) as vscode.DebugConfiguration[];
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    public static updateLaunchJson(launchJsonPath: fs.PathLike, launchJsonData: any) {
        fs.writeFileSync(launchJsonPath, JSON.stringify(launchJsonData, null, 4), 'utf8');
    }
}