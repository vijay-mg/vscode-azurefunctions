/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { HttpAuthLevel, ParsedFunctionJson } from '../extension.bundle';

// tslint:disable-next-line:max-func-body-length
suite('ParsedFunctionJson', () => {
    test('null', () => {
        // tslint:disable-next-line: no-null-keyword
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson(null);
        assert.equal(funcJson.authLevel, HttpAuthLevel.function);
        assert.equal(funcJson.bindings.length, 0);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, undefined);
        assert.equal(funcJson.isHttpTrigger, false);
        assert.equal(funcJson.isTimerTrigger, false);
    });

    test('undefined', () => {
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson(undefined);
        assert.equal(funcJson.authLevel, HttpAuthLevel.function);
        assert.equal(funcJson.bindings.length, 0);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, undefined);
        assert.equal(funcJson.isHttpTrigger, false);
        assert.equal(funcJson.isTimerTrigger, false);
    });

    test('empty object', () => {
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({});
        assert.equal(funcJson.authLevel, HttpAuthLevel.function);
        assert.equal(funcJson.bindings.length, 0);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, undefined);
        assert.equal(funcJson.isHttpTrigger, false);
        assert.equal(funcJson.isTimerTrigger, false);
    });

    test('bindings is not array', () => {
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({ bindings: 'test' });
        assert.equal(funcJson.authLevel, HttpAuthLevel.function);
        assert.equal(funcJson.bindings.length, 0);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, undefined);
        assert.equal(funcJson.isHttpTrigger, false);
        assert.equal(funcJson.isTimerTrigger, false);
    });

    test('disabled function', () => {
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({
            disabled: true
        });
        assert.equal(funcJson.authLevel, HttpAuthLevel.function);
        assert.equal(funcJson.bindings.length, 0);
        assert.equal(funcJson.disabled, true);
        assert.equal(funcJson.triggerBinding, undefined);
        assert.equal(funcJson.isHttpTrigger, false);
        assert.equal(funcJson.isTimerTrigger, false);
    });

    test('trigger binding type is not http', () => {
        const triggerBinding: {} = {
            direction: 'in',
            type: 'testTrigger'
        };
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({ bindings: [triggerBinding] });
        assert.equal(funcJson.authLevel, HttpAuthLevel.function);
        assert.equal(funcJson.bindings.length, 1);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, triggerBinding);
        assert.equal(funcJson.isHttpTrigger, false);
        assert.equal(funcJson.isTimerTrigger, false);
    });

    test('http trigger', () => {
        const triggerBinding: {} = {
            direction: 'in',
            type: 'httpTrigger'
        };
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({ bindings: [triggerBinding] });
        assert.equal(funcJson.authLevel, HttpAuthLevel.function);
        assert.equal(funcJson.bindings.length, 1);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, triggerBinding);
        assert.equal(funcJson.isHttpTrigger, true);
        assert.equal(funcJson.isTimerTrigger, false);
    });

    test('http trigger weird casing', () => {
        const triggerBinding: {} = {
            direction: 'in',
            type: 'hTtpTrigGer'
        };
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({ bindings: [triggerBinding] });
        assert.equal(funcJson.authLevel, HttpAuthLevel.function);
        assert.equal(funcJson.bindings.length, 1);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, triggerBinding);
        assert.equal(funcJson.isHttpTrigger, true);
        assert.equal(funcJson.isTimerTrigger, false);
    });

    test('timer trigger', () => {
        const triggerBinding: {} = {
            direction: 'in',
            type: 'timerTrigger'
        };
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({ bindings: [triggerBinding] });
        assert.equal(funcJson.authLevel, HttpAuthLevel.function);
        assert.equal(funcJson.bindings.length, 1);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, triggerBinding);
        assert.equal(funcJson.isHttpTrigger, false);
        assert.equal(funcJson.isTimerTrigger, true);
    });

    test('timer trigger weird casing', () => {
        const triggerBinding: {} = {
            direction: 'in',
            type: 'TiMerTriggER'
        };
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({ bindings: [triggerBinding] });
        assert.equal(funcJson.authLevel, HttpAuthLevel.function);
        assert.equal(funcJson.bindings.length, 1);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, triggerBinding);
        assert.equal(funcJson.isHttpTrigger, false);
        assert.equal(funcJson.isTimerTrigger, true);
    });

    test('admin auth level', () => {
        const triggerBinding: {} = {
            direction: 'in',
            type: 'httpTrigger',
            authLevel: 'admin'
        };
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({ bindings: [triggerBinding] });
        assert.equal(funcJson.authLevel, HttpAuthLevel.admin);
        assert.equal(funcJson.bindings.length, 1);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, triggerBinding);
        assert.equal(funcJson.isHttpTrigger, true);
        assert.equal(funcJson.isTimerTrigger, false);
    });

    test('function auth level', () => {
        const triggerBinding: {} = {
            direction: 'in',
            type: 'httpTrigger',
            authLevel: 'function'
        };
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({ bindings: [triggerBinding] });
        assert.equal(funcJson.authLevel, HttpAuthLevel.function);
        assert.equal(funcJson.bindings.length, 1);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, triggerBinding);
        assert.equal(funcJson.isHttpTrigger, true);
        assert.equal(funcJson.isTimerTrigger, false);
    });

    test('anonymous auth level', () => {
        const triggerBinding: {} = {
            direction: 'in',
            type: 'httpTrigger',
            authLevel: 'anonymous'
        };
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({ bindings: [triggerBinding] });
        assert.equal(funcJson.authLevel, HttpAuthLevel.anonymous);
        assert.equal(funcJson.bindings.length, 1);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, triggerBinding);
        assert.equal(funcJson.isHttpTrigger, true);
        assert.equal(funcJson.isTimerTrigger, false);
    });

    test('unrecognized auth level', () => {
        const triggerBinding: {} = {
            direction: 'in',
            type: 'httpTrigger',
            authLevel: 'testAuthLevel'
        };
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({ bindings: [triggerBinding] });
        assert.throws(
            () => funcJson.authLevel,
            (error: Error) => error.message.includes('Unrecognized') && error.message.includes('testAuthLevel')
        );
        assert.equal(funcJson.bindings.length, 1);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, triggerBinding);
        assert.equal(funcJson.isHttpTrigger, true);
        assert.equal(funcJson.isTimerTrigger, false);
    });

    test('Multiple http bindings', () => {
        const triggerBinding: {} = {
            direction: 'in',
            type: 'httpTrigger',
            authLevel: 'admin'
        };
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({
            bindings: [
                {
                    direction: 'out',
                    type: 'http',
                    authLevel: 'anonymous'
                },
                {
                    direction: 'in',
                    type: 'http',
                    authLevel: 'anonymous'
                },
                triggerBinding
            ]
        });
        // auth level from triggerBinding should be used
        assert.equal(funcJson.authLevel, HttpAuthLevel.admin);
        assert.equal(funcJson.bindings.length, 3);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, triggerBinding);
        assert.equal(funcJson.isHttpTrigger, true);
        assert.equal(funcJson.isTimerTrigger, false);
    });

    // This happens for C# functions
    test('generated function.json that doesn\'t have direction defined', () => {
        const triggerBinding: {} = {
            type: 'httpTrigger',
            authLevel: 'admin'
        };
        const funcJson: ParsedFunctionJson = new ParsedFunctionJson({ bindings: [triggerBinding] });
        assert.equal(funcJson.authLevel, HttpAuthLevel.admin);
        assert.equal(funcJson.bindings.length, 1);
        assert.equal(funcJson.disabled, false);
        assert.equal(funcJson.triggerBinding, triggerBinding);
        assert.equal(funcJson.isHttpTrigger, true);
        assert.equal(funcJson.isTimerTrigger, false);
    });
});
