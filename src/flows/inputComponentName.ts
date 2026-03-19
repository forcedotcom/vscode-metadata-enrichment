/*
 * Copyright 2026, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as vscode from 'vscode';
import { getMessage } from '../utils/localization';

/**
 * FLOW - Input Component Name
 * 
 * Prompts the user to input their target component name(s) to enrich.
 * This supports wildcards (*) to enrich all matching components.
 */
export async function inputComponentName(typeLabel: string): Promise<string[] | undefined> {
  const componentNameInput = await vscode.window.showInputBox({
    prompt: getMessage('Enter the component name (use * to enrich all {0} components)', typeLabel),
    placeHolder: getMessage('e.g. myLwcComponent  or  *'),
    ignoreFocusOut: true,
    validateInput: value => (value.trim() ? null : getMessage('Component name is required'))
  });
  if (componentNameInput === undefined) {
    return undefined;
  }
  return [`${typeLabel}:${componentNameInput.trim()}`];
}
