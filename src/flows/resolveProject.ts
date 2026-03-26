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
import { SfProject } from '@salesforce/core';
import { getMessage } from '../utils/localization';

/**
 * FLOW - Resolve Project
 *
 * Resolves the Salesforce DX project folder and returns the project instance.
 * Displays pop-up error to user if no workspace folder is open.
 */
export async function resolveProject(): Promise<SfProject | undefined> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage(getMessage('command.metadata.enrich.error.noWorkspace'));
    return undefined;
  }
  return SfProject.resolve(workspaceFolder.uri.fsPath);
}
