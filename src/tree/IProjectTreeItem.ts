/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IParsedHostJson } from '../funcConfig/host';
import { FuncVersion } from '../FuncVersion';
import { ProjectSource } from './projectContextValues';

export type ApplicationSettings = { [propertyName: string]: string };

export interface IProjectTreeItem {
    source: ProjectSource;
    hostUrl: string;
    getHostJson(): Promise<IParsedHostJson>;
    getVersion(): Promise<FuncVersion>;
    getApplicationSettings(): Promise<ApplicationSettings>;
    setApplicationSetting(key: string, value: string): Promise<void>;
}
