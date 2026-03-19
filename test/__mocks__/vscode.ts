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

export const window = {
  createOutputChannel: jest.fn(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  showQuickPick: jest.fn(),
  showInputBox: jest.fn(),
  withProgress: jest.fn()
};

export const workspace = {
  workspaceFolders: [{ uri: { fsPath: '/workspace' } }]
};

export const commands = {
  registerCommand: jest.fn()
};

export const ProgressLocation = { Notification: 15 };

export const l10n = {
  t: jest.fn((message: string, ...args: string[]) =>
    args.reduce((msg, arg, i) => msg.replace(`{${i}}`, arg), message)
  )
};
