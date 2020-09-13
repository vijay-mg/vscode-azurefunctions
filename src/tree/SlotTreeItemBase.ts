/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementModels } from '@azure/arm-appservice';
import { AppSettingsTreeItem, AppSettingTreeItem, deleteSite, DeploymentsTreeItem, DeploymentTreeItem, getFile, ISiteTreeRoot, LogFilesTreeItem, SiteClient, SiteFilesTreeItem } from 'vscode-azureappservice';
import { AzExtTreeItem, AzureParentTreeItem, TreeItemIconPath } from 'vscode-azureextensionui';
import { runFromPackageKey } from '../constants';
import { IParsedHostJson, parseHostJson } from '../funcConfig/host';
import { FuncVersion, latestGAVersion, tryParseFuncVersion } from '../FuncVersion';
import { envUtils } from '../utils/envUtils';
import { treeUtils } from '../utils/treeUtils';
import { ApplicationSettings, IProjectTreeItem } from './IProjectTreeItem';
import { matchesAnyPart, ProjectResource, ProjectSource } from './projectContextValues';
import { ProxiesTreeItem } from './ProxiesTreeItem';
import { ProxyTreeItem } from './ProxyTreeItem';
import { RemoteFunctionsTreeItem } from './remoteProject/RemoteFunctionsTreeItem';

export abstract class SlotTreeItemBase extends AzureParentTreeItem<ISiteTreeRoot> implements IProjectTreeItem {
    public logStreamPath: string = '';
    public readonly appSettingsTreeItem: AppSettingsTreeItem;
    public deploymentsNode: DeploymentsTreeItem | undefined;
    public readonly source: ProjectSource = ProjectSource.Remote;
    public readonly site: WebSiteManagementModels.Site;

    public abstract readonly contextValue: string;
    public abstract readonly label: string;

    private readonly _root: ISiteTreeRoot;
    private _state?: string;
    private _functionsTreeItem: RemoteFunctionsTreeItem | undefined;
    private _proxiesTreeItem: ProxiesTreeItem | undefined;
    private readonly _logFilesTreeItem: LogFilesTreeItem;
    private readonly _siteFilesTreeItem: SiteFilesTreeItem;
    private _cachedVersion: FuncVersion | undefined;
    private _cachedHostJson: IParsedHostJson | undefined;
    private _cachedIsConsumption: boolean | undefined;

    public constructor(parent: AzureParentTreeItem, client: SiteClient, site: WebSiteManagementModels.Site) {
        super(parent);
        this.site = site;
        this._root = Object.assign({}, parent.root, { client });
        this._state = client.initialState;
        this.appSettingsTreeItem = new AppSettingsTreeItem(this, client);
        this._siteFilesTreeItem = new SiteFilesTreeItem(this, client, true);
        this._logFilesTreeItem = new LogFilesTreeItem(this, client);
    }

    // overrides ISubscriptionContext with an object that also has SiteClient
    public get root(): ISiteTreeRoot {
        return this._root;
    }

    public get client(): SiteClient {
        return this.root.client;
    }

    public get logStreamLabel(): string {
        return this.root.client.fullName;
    }

    public get id(): string {
        return this.root.client.id;
    }

    public get hostUrl(): string {
        return this.root.client.defaultHostUrl;
    }

    public get description(): string | undefined {
        return this._state && this._state.toLowerCase() !== 'running' ? this._state : undefined;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath(this.contextValue);
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    /**
     * NOTE: We need to be extra careful in this method because it blocks many core scenarios (e.g. deploy) if the tree item is listed as invalid
     */
    public async refreshImpl(): Promise<void> {
        this._cachedVersion = undefined;
        this._cachedHostJson = undefined;
        this._cachedIsConsumption = undefined;

        try {
            this._state = await this.root.client.getState();
        } catch {
            this._state = 'Unknown';
        }
    }

    public async getVersion(): Promise<FuncVersion> {
        let result: FuncVersion | undefined = this._cachedVersion;
        if (result === undefined) {
            let version: FuncVersion | undefined;
            try {
                const appSettings: WebSiteManagementModels.StringDictionary = await this.root.client.listApplicationSettings();
                version = tryParseFuncVersion(appSettings.properties && appSettings.properties.FUNCTIONS_EXTENSION_VERSION);
            } catch {
                // ignore and use default
            }
            // tslint:disable-next-line: strict-boolean-expressions
            result = version || latestGAVersion;
            this._cachedVersion = result;
        }

        return result;
    }

    public async getHostJson(): Promise<IParsedHostJson> {
        let result: IParsedHostJson | undefined = this._cachedHostJson;
        if (!result) {
            // tslint:disable-next-line: no-any
            let data: any;
            try {
                data = JSON.parse((await getFile(this.client, 'site/wwwroot/host.json')).data);
            } catch {
                // ignore and use default
            }
            const version: FuncVersion = await this.getVersion();
            result = parseHostJson(data, version);
            this._cachedHostJson = result;
        }

        return result;
    }

    public async getApplicationSettings(): Promise<ApplicationSettings> {
        const appSettings: WebSiteManagementModels.StringDictionary = await this.root.client.listApplicationSettings();
        // tslint:disable-next-line: strict-boolean-expressions
        return appSettings.properties || {};
    }

    public async setApplicationSetting(key: string, value: string): Promise<void> {
        const settings: WebSiteManagementModels.StringDictionary = await this.root.client.listApplicationSettings();
        if (!settings.properties) {
            settings.properties = {};
        }
        settings.properties[key] = value;
        await this.root.client.updateApplicationSettings(settings);
    }

    public async getIsConsumption(): Promise<boolean> {
        let result: boolean | undefined = this._cachedIsConsumption;
        if (result === undefined) {
            try {
                result = await this.root.client.getIsConsumption();
            } catch {
                // ignore and use default
                result = true;
            }
            this._cachedIsConsumption = result;
        }

        return result;
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        const siteConfig: WebSiteManagementModels.SiteConfig = await this.root.client.getSiteConfig();
        const sourceControl: WebSiteManagementModels.SiteSourceControl = await this.root.client.getSourceControl();
        this.deploymentsNode = new DeploymentsTreeItem(this, this.root.client, siteConfig, sourceControl);

        if (!this._functionsTreeItem) {
            this._functionsTreeItem = await RemoteFunctionsTreeItem.createFunctionsTreeItem(this);
        }

        if (!this._proxiesTreeItem) {
            this._proxiesTreeItem = await ProxiesTreeItem.createProxiesTreeItem(this);
        }

        return [this._functionsTreeItem, this.appSettingsTreeItem, this._siteFilesTreeItem, this._logFilesTreeItem, this.deploymentsNode, this._proxiesTreeItem];
    }

    public async pickTreeItemImpl(expectedContextValues: (string | RegExp)[]): Promise<AzExtTreeItem | undefined> {
        for (const expectedContextValue of expectedContextValues) {
            switch (expectedContextValue) {
                case AppSettingsTreeItem.contextValue:
                case AppSettingTreeItem.contextValue:
                    return this.appSettingsTreeItem;
                case ProxiesTreeItem.contextValue:
                case ProxyTreeItem.contextValue:
                case ProxyTreeItem.readOnlyContextValue:
                    return this._proxiesTreeItem;
                case DeploymentsTreeItem.contextValueConnected:
                case DeploymentsTreeItem.contextValueUnconnected:
                case DeploymentTreeItem.contextValue:
                    return this.deploymentsNode;
                default:
                    if (typeof expectedContextValue === 'string') {
                        // DeploymentTreeItem.contextValue is a RegExp, but the passed in contextValue can be a string so check for a match
                        if (DeploymentTreeItem.contextValue.test(expectedContextValue)) {
                            return this.deploymentsNode;
                        }
                    } else if (matchesAnyPart(expectedContextValue, ProjectResource.Functions, ProjectResource.Function)) {
                        return this._functionsTreeItem;
                    }
            }
        }

        return undefined;
    }

    public compareChildrenImpl(): number {
        return 0; // already sorted
    }

    public async isReadOnly(): Promise<boolean> {
        const appSettings: WebSiteManagementModels.StringDictionary = await this.root.client.listApplicationSettings();
        return [runFromPackageKey, 'WEBSITE_RUN_FROM_ZIP'].some(key => appSettings.properties && envUtils.isEnvironmentVariableSet(appSettings.properties[key]));
    }

    public async deleteTreeItemImpl(): Promise<void> {
        await deleteSite(this.root.client);
    }
}
