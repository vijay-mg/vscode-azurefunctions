/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window, workspace, WorkspaceFolder } from 'vscode';
import { AzureWizard, IActionContext, UserCancelledError } from 'vscode-azureextensionui';
import { funcVersionSetting, ProjectLanguage, projectLanguageSetting } from '../../constants';
import { NoWorkspaceError } from '../../errors';
import { tryGetLocalFuncVersion } from '../../funcCoreTools/tryGetLocalFuncVersion';
import { FuncVersion, latestGAVersion } from '../../FuncVersion';
import { localize } from '../../localize';
import { getContainingWorkspace } from '../../utils/workspace';
import { getGlobalSetting } from '../../vsCodeConfig/settings';
import { IProjectWizardContext } from '../createNewProject/IProjectWizardContext';
import { verifyAndPromptToCreateProject } from '../createNewProject/verifyIsProject';
import { detectProjectLanguage } from './detectProjectLanguage';
import { InitVSCodeLanguageStep } from './InitVSCodeLanguageStep';

export async function initProjectForVSCode(context: IActionContext, fsPath?: string, language?: ProjectLanguage): Promise<void> {
    let workspaceFolder: WorkspaceFolder | undefined;
    let workspacePath: string;
    if (fsPath === undefined) {
        if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
            throw new NoWorkspaceError();
        } else {
            const placeHolder: string = localize('selectFunctionAppFolderNew', 'Select the folder to initialize for use with VS Code');
            workspaceFolder = await window.showWorkspaceFolderPick({ placeHolder });
            if (!workspaceFolder) {
                throw new UserCancelledError();
            } else {
                workspacePath = workspaceFolder.uri.fsPath;
            }
        }
    } else {
        workspaceFolder = getContainingWorkspace(fsPath);
        workspacePath = workspaceFolder ? workspaceFolder.uri.fsPath : fsPath;
    }

    const projectPath: string | undefined = await verifyAndPromptToCreateProject(context, workspacePath);
    if (!projectPath) {
        return;
    }

    // tslint:disable-next-line: strict-boolean-expressions
    language = language || getGlobalSetting(projectLanguageSetting) || await detectProjectLanguage(projectPath);
    // tslint:disable-next-line: strict-boolean-expressions
    const version: FuncVersion = getGlobalSetting(funcVersionSetting) || await tryGetLocalFuncVersion() || latestGAVersion;

    const wizardContext: IProjectWizardContext = Object.assign(context, { projectPath, workspacePath, language, version, workspaceFolder });
    const wizard: AzureWizard<IProjectWizardContext> = new AzureWizard(wizardContext, { promptSteps: [new InitVSCodeLanguageStep()] });
    await wizard.prompt();
    await wizard.execute();

    // don't wait
    window.showInformationMessage(localize('finishedInitializing', 'Finished initializing for use with VS Code.'));
}
