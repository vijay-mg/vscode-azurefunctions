/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as path from 'path';
import { IActionContext } from 'vscode-azureextensionui';
import { cliFeedUtils } from '../../utils/cliFeedUtils';
import { parseJson } from '../../utils/parseJson';
import { requestUtils } from '../../utils/requestUtils';
import { ITemplates } from '../ITemplates';
import { TemplateProviderBase, TemplateType } from '../TemplateProviderBase';
import { executeDotnetTemplateCommand, getDotnetItemTemplatePath, getDotnetProjectTemplatePath, validateDotnetInstalled } from './executeDotnetTemplateCommand';
import { parseDotnetTemplates } from './parseDotnetTemplates';

export class DotnetTemplateProvider extends TemplateProviderBase {
    public templateType: TemplateType = TemplateType.Dotnet;

    protected get backupSubpath(): string {
        return path.join('dotnet', this.version);
    }

    private readonly _dotnetTemplatesKey: string = 'DotnetTemplates';
    private _rawTemplates: object[];

    public async getCachedTemplates(): Promise<ITemplates | undefined> {
        const projectFilePath: string = getDotnetProjectTemplatePath(this.version);
        const itemFilePath: string = getDotnetItemTemplatePath(this.version);
        if (!await fse.pathExists(projectFilePath) || !await fse.pathExists(itemFilePath)) {
            return undefined;
        }

        const cachedDotnetTemplates: object[] | undefined = await this.getCachedValue(this._dotnetTemplatesKey);
        if (cachedDotnetTemplates) {
            return await parseDotnetTemplates(cachedDotnetTemplates, this.version);
        } else {
            return undefined;
        }
    }

    public async getLatestTemplateVersion(): Promise<string> {
        return await cliFeedUtils.getLatestVersion(this.version);
    }

    public async getLatestTemplates(context: IActionContext, latestTemplateVersion: string): Promise<ITemplates> {
        await validateDotnetInstalled(context);

        const release: cliFeedUtils.IRelease = await cliFeedUtils.getRelease(latestTemplateVersion);

        const projectFilePath: string = getDotnetProjectTemplatePath(this.version);

        const itemFilePath: string = getDotnetItemTemplatePath(this.version);

        await Promise.all([
            requestUtils.downloadFile(release.projectTemplates, projectFilePath),
            requestUtils.downloadFile(release.itemTemplates, itemFilePath)
        ]);

        return await this.parseTemplates(context);
    }

    public async getBackupTemplates(context: IActionContext): Promise<ITemplates> {
        const backupPath: string = this.getBackupPath();
        const files: string[] = [getDotnetProjectTemplatePath(this.version), getDotnetItemTemplatePath(this.version)];
        for (const file of files) {
            await fse.copy(path.join(backupPath, path.basename(file)), file);
        }
        return await this.parseTemplates(context);
    }

    public async updateBackupTemplates(): Promise<void> {
        const backupPath: string = this.getBackupPath();
        const files: string[] = [getDotnetProjectTemplatePath(this.version), getDotnetItemTemplatePath(this.version)];
        for (const file of files) {
            await fse.copy(file, path.join(backupPath, path.basename(file)));
        }
    }

    public async cacheTemplates(): Promise<void> {
        await this.updateCachedValue(this._dotnetTemplatesKey, this._rawTemplates);
    }

    private async parseTemplates(context: IActionContext): Promise<ITemplates> {
        this._rawTemplates = parseJson(await executeDotnetTemplateCommand(context, this.version, undefined, 'list'));
        return parseDotnetTemplates(this._rawTemplates, this.version);
    }
}
