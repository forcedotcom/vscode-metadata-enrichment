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
import { SUPPORTED_METADATA_TYPES } from '../constants/constants';
import { getMessage } from '../utils/localization';

/**
 * FLOW - Input Metadata Type
 *
 * Prompts the user to select a target metadata type to enrich.
 * Only one metadata type can be selected. Multiple metadata types in one operation are not supported.
 */
export async function pickMetadataType(): Promise<vscode.QuickPickItem | undefined> {
  return vscode.window.showQuickPick(SUPPORTED_METADATA_TYPES, {
    placeHolder: getMessage('command.metadata.enrich.pick.type.placeholder'),
    ignoreFocusOut: true
  });
}
