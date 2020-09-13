/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { isString } from 'util';
import { ProjectLanguage } from '../../constants';
import { IFunctionBinding, ParsedFunctionJson } from '../../funcConfig/function';
import { localize } from '../../localize';
import { IBindingSetting, IBindingTemplate, IEnumValue, ResourceType, ValueType } from '../IBindingTemplate';
import { IFunctionTemplate, TemplateCategory } from '../IFunctionTemplate';
import { ITemplates } from '../ITemplates';

/**
 * Describes a script template before it has been parsed
 */
export interface IRawTemplate {
    id: string;
    // tslint:disable-next-line:no-reserved-keywords
    function: {};
    metadata: {
        defaultFunctionName: string;
        name: string;
        language: ProjectLanguage;
        userPrompt?: string[];
        category: TemplateCategory[] | undefined;
    };
    files: { [filename: string]: string };
}

/**
 * Describes a script template setting before it has been parsed
 */
interface IRawSetting {
    name: string;
    value: ValueType;
    label: string;
    help?: string;
    defaultValue?: string;
    required?: boolean;
    resource?: ResourceType;
    validators?: {
        expression: string;
        errorText: string;
    }[];
    // tslint:disable-next-line:no-reserved-keywords
    enum?: {
        value: string;
        display: string;
    }[];
}

interface IRawBinding {
    // tslint:disable-next-line:no-reserved-keywords
    type: string;
    documentation: string;
    displayName: string;
    direction: string;
    settings: object[];
}

/**
 * Describes script template config to be used for parsing
 */
export interface IConfig {
    variables: IVariables;
    bindings: object[];
}

/**
 * Describes script template variables to be used for parsing
 */
interface IVariables { [name: string]: string; }

/**
 * Describes script template resources to be used for parsing
 */
export interface IResources {
    lang?: { [key: string]: string | undefined };
    // Every Resources.json file also contains the english strings
    en: { [key: string]: string | undefined };
}

// tslint:disable-next-line:no-any
function getVariableValue(resources: IResources, variables: IVariables, data: string): string {
    if (!isString(data)) {
        // This evaluates to a non-string value in rare cases, in which case we just return the value as-is
        return data;
    }

    const matches: RegExpMatchArray | null = data.match(/\[variables\(\'(.*)\'\)\]/);
    data = matches !== null ? variables[matches[1]] : data;

    return getResourceValue(resources, data);
}

export function getResourceValue(resources: IResources, data: string): string {
    const matches: RegExpMatchArray | null = data.match(/\$(.*)/);
    if (matches === null) {
        return data;
    } else {
        const key: string = matches[1];
        const result: string | undefined = resources.lang && resources.lang[key] ? resources.lang[key] : resources.en[key];
        if (result === undefined) {
            throw new Error(localize('resourceNotFound', 'Resource "{0}" not found.', data));
        } else {
            return result;
        }
    }
}

function parseScriptSetting(data: object, resources: IResources, variables: IVariables): IBindingSetting {
    const rawSetting: IRawSetting = <IRawSetting>data;
    const enums: IEnumValue[] = [];
    if (rawSetting.enum) {
        for (const ev of rawSetting.enum) {
            enums.push({
                value: getVariableValue(resources, variables, ev.value),
                displayName: getVariableValue(resources, variables, ev.display)
            });
        }
    }

    return {
        name: getVariableValue(resources, variables, rawSetting.name),
        resourceType: rawSetting.resource,
        valueType: rawSetting.value,
        description: rawSetting.help ? replaceHtmlLinkWithMarkdown(getResourceValue(resources, rawSetting.help)) : undefined,
        defaultValue: rawSetting.defaultValue,
        label: getVariableValue(resources, variables, rawSetting.label),
        enums: enums,
        required: rawSetting.required,
        validateSetting: (value: string | undefined): string | undefined => {
            if (rawSetting.validators) {
                for (const validator of rawSetting.validators) {
                    if (!value || value.match(validator.expression) === null) {
                        return replaceHtmlLinkWithMarkdown(getVariableValue(resources, variables, validator.errorText));
                    }
                }
            }

            return undefined;
        }
    };
}

function replaceHtmlLinkWithMarkdown(text: string): string {
    const match: RegExpMatchArray | null = text.match(/<a[^>]*href=['"]([^'"]*)['"][^>]*>([^<]*)<\/a>/i);
    if (match) {
        return text.replace(match[0], `[${match[2]}](${match[1]})`);
    } else {
        return text;
    }
}

export function parseScriptBindings(config: IConfig, resources: IResources): IBindingTemplate[] {
    return config.bindings.map((rawBinding: IRawBinding) => {
        const settings: IBindingSetting[] = rawBinding.settings.map((setting: object) => parseScriptSetting(setting, resources, config.variables));
        return {
            direction: rawBinding.direction,
            displayName: getResourceValue(resources, rawBinding.displayName),
            isHttpTrigger: !!rawBinding.type && /^http/i.test(rawBinding.type),
            isTimerTrigger: !!rawBinding.type && /^timer/i.test(rawBinding.type),
            settings,
            type: rawBinding.type
        };
    });
}

export function parseScriptTemplate(rawTemplate: IRawTemplate, resources: IResources, bindingTemplates: IBindingTemplate[]): IScriptFunctionTemplate {
    const functionJson: ParsedFunctionJson = new ParsedFunctionJson(rawTemplate.function);

    let language: ProjectLanguage = rawTemplate.metadata.language;
    // The templateApiZip only supports script languages, and thus incorrectly defines 'C#Script' as 'C#', etc.
    switch (language) {
        case ProjectLanguage.CSharp:
            language = ProjectLanguage.CSharpScript;
            break;
        case ProjectLanguage.FSharp:
            language = ProjectLanguage.FSharpScript;
            break;
        // The schema of Java templates is the same as script languages, so put it here.
        case ProjectLanguage.Java:
            language = ProjectLanguage.Java;
            break;
        default:
    }

    const userPromptedSettings: IBindingSetting[] = [];
    if (rawTemplate.metadata.userPrompt) {
        for (const settingName of rawTemplate.metadata.userPrompt) {
            if (functionJson.triggerBinding) {
                const triggerBinding: IFunctionBinding = functionJson.triggerBinding;
                const bindingTemplate: IBindingTemplate | undefined = bindingTemplates.find(b => b.type === triggerBinding.type);
                if (bindingTemplate) {
                    const setting: IBindingSetting | undefined = bindingTemplate.settings.find((bs: IBindingSetting) => bs.name === settingName);
                    if (setting) {
                        const functionSpecificDefaultValue: string | undefined = triggerBinding[setting.name];
                        if (functionSpecificDefaultValue) {
                            // overwrite common default value with the function-specific default value
                            setting.defaultValue = functionSpecificDefaultValue;
                        }
                        userPromptedSettings.push(setting);
                    }
                }
            }
        }
    }

    return {
        functionJson,
        isHttpTrigger: functionJson.isHttpTrigger,
        isTimerTrigger: functionJson.isTimerTrigger,
        id: rawTemplate.id,
        name: getResourceValue(resources, rawTemplate.metadata.name),
        defaultFunctionName: rawTemplate.metadata.defaultFunctionName,
        language,
        userPromptedSettings,
        templateFiles: rawTemplate.files,
        // tslint:disable-next-line: strict-boolean-expressions
        categories: rawTemplate.metadata.category || []
    };
}

export interface IScriptFunctionTemplate extends IFunctionTemplate {
    templateFiles: { [filename: string]: string };
    functionJson: ParsedFunctionJson;
}

/**
 * Parses templates contained in the templateApiZip of the functions cli feed. This contains all 'script' templates, including JavaScript, C#Script, Python, etc.
 * This basically converts the 'raw' templates in the externally defined JSON format to a common and understood format (IFunctionTemplate) used by this extension
 */
export function parseScriptTemplates(rawResources: object, rawTemplates: object[], rawConfig: object): ITemplates {
    const bindingTemplates: IBindingTemplate[] = parseScriptBindings(<IConfig>rawConfig, <IResources>rawResources);

    const functionTemplates: IFunctionTemplate[] = [];
    for (const rawTemplate of rawTemplates) {
        try {
            functionTemplates.push(parseScriptTemplate(<IRawTemplate>rawTemplate, <IResources>rawResources, bindingTemplates));
        } catch (error) {
            // Ignore errors so that a single poorly formed template does not affect other templates
        }
    }

    return { functionTemplates, bindingTemplates };
}
