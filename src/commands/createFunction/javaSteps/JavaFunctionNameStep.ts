/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import { localize } from "../../../localize";
import { IFunctionTemplate } from '../../../templates/IFunctionTemplate';
import { nonNullProp } from '../../../utils/nonNull';
import { getJavaClassName, getJavaFunctionFilePath, getJavaPackagePath, IJavaProjectWizardContext } from '../../createNewProject/javaSteps/IJavaProjectWizardContext';
import { FunctionNameStepBase } from '../FunctionNameStepBase';
import { IFunctionWizardContext } from '../IFunctionWizardContext';

export class JavaFunctionNameStep extends FunctionNameStepBase<IFunctionWizardContext & IJavaProjectWizardContext> {
    protected async getUniqueFunctionName(context: IFunctionWizardContext & IJavaProjectWizardContext): Promise<string | undefined> {
        const template: IFunctionTemplate = nonNullProp(context, 'functionTemplate');
        const packageName: string = nonNullProp(context, 'javaPackageName');
        return await this.getUniqueFsPath(getJavaPackagePath(context.projectPath, packageName), getJavaClassName(template.defaultFunctionName), '.java');
    }

    protected async validateFunctionNameCore(context: IFunctionWizardContext & IJavaProjectWizardContext, name: string): Promise<string | undefined> {
        const packageName: string = nonNullProp(context, 'javaPackageName');
        if (await fse.pathExists(getJavaFunctionFilePath(context.projectPath, packageName, name))) {
            return localize('existingError', 'A function with name "{0}" already exists in package "{1}".', getJavaClassName(name), packageName);
        } else {
            return undefined;
        }
    }
}
