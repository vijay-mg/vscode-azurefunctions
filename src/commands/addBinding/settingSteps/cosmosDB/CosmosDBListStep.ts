/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CosmosDBManagementClient } from '@azure/arm-cosmosdb';
import { AzureWizardPromptStep, createAzureClient } from 'vscode-azureextensionui';
import { localize } from '../../../../localize';
import { promptForResource } from '../../../../utils/azure';
import { ICosmosDBWizardContext } from './ICosmosDBWizardContext';

export class CosmosDBListStep extends AzureWizardPromptStep<ICosmosDBWizardContext> {
    public async prompt(context: ICosmosDBWizardContext): Promise<void> {
        const placeHolder: string = localize('placeHolder', 'Select a database account');
        const client: CosmosDBManagementClient = createAzureClient(context, CosmosDBManagementClient);
        context.databaseAccount = await promptForResource(placeHolder, client.databaseAccounts.list());
    }

    public shouldPrompt(context: ICosmosDBWizardContext): boolean {
        return !context.databaseAccount;
    }
}
