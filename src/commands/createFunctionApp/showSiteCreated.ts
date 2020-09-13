/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import { SiteClient } from 'vscode-azureappservice';
import { IActionContext } from 'vscode-azureextensionui';
import { viewOutput } from '../../constants';
import { ext } from '../../extensionVariables';
import { localize } from '../../localize';

export interface ISiteCreatedOptions extends IActionContext {
    showCreatedNotification?: boolean;
}

export function showSiteCreated(client: SiteClient, context: ISiteCreatedOptions): void {
    const message: string = client.isSlot ?
        localize('createdNewSlot', 'Successfully created slot "{0}": {1}', client.slotName, client.defaultHostUrl) :
        localize('createdNewApp', 'Successfully created function app "{0}": {1}', client.fullName, client.defaultHostUrl);

    ext.outputChannel.appendLog(message);

    if (context.showCreatedNotification) {
        // don't wait
        window.showInformationMessage(message, viewOutput).then(async result => {
            if (result === viewOutput) {
                ext.outputChannel.show();
            }
        });
    }
}
