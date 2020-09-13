/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InputBoxOptions } from "vscode";
import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../localize";
import { nonNullProp } from "../../../utils/nonNull";
import { IJavaProjectWizardContext } from "./IJavaProjectWizardContext";

export class JavaAppNameStep extends AzureWizardPromptStep<IJavaProjectWizardContext> {
    public async prompt(context: IJavaProjectWizardContext): Promise<void> {
        const options: InputBoxOptions = {
            placeHolder: localize('appNamePlaceHolder', 'App name'),
            prompt: localize('appNamePrompt', 'Provide an app name'),
            value: `${nonNullProp(context, 'javaArtifactId')}-${Date.now()}`
        };
        context.javaAppName = await ext.ui.showInputBox(options);
    }

    public shouldPrompt(context: IJavaProjectWizardContext): boolean {
        return !context.javaAppName;
    }
}
