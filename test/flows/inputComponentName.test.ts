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
import { inputComponentName } from '../../src/flows/inputComponentName';

describe('inputComponentName', () => {
  it('returns metadataEntries for the given type and component name', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('myComp');

    const result = await inputComponentName('LightningComponentBundle');

    expect(vscode.window.showInputBox).toHaveBeenCalledWith(expect.objectContaining({ ignoreFocusOut: true }));
    expect(result).toEqual(['LightningComponentBundle:myComp']);
  });

  it('returns the validation message when input is blank', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('myComp');
    await inputComponentName('LightningComponentBundle');

    const call = (vscode.window.showInputBox as jest.Mock).mock.calls[0][0];
    expect(call.validateInput('   ')).toBe('Component name is required');
    expect(call.validateInput('myComp')).toBeNull();
  });
});
