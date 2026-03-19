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
 * FLOW - Input Component Names
 *
 * Prompts the user to input one or more target component names to enrich,
 * comma-separated. Supports wildcards (*) to enrich all matching components.
 * Deduplicates and trims whitespaces from user input.
 */
export async function inputComponentNames(typeLabel: string): Promise<string[] | undefined> {
  const input = await vscode.window.showInputBox({
    prompt: getMessage('command.metadata.enrich.input.component.prompt', typeLabel),
    placeHolder: getMessage('command.metadata.enrich.input.component.placeholder'),
    ignoreFocusOut: true,
    validateInput: value => (value.trim() ? null : getMessage('command.metadata.enrich.input.component.validation'))
  });
  if (input === undefined) {
    return undefined;
  }

  const stripQuotes = (s: string) => s.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');

  // Trim whitespace, strip surrounding quotes, then deduplicate
  return [...new Set(
    input
      .split(',')
      .map(name => stripQuotes(name.trim()))
      .filter(name => name.length > 0)
      .map(name => `${typeLabel}:${name}`)
  )];
}
