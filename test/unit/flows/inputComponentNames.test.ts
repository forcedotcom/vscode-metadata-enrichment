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
import { inputComponentNames } from '../../../src/flows/inputComponentNames';

describe('inputComponentNames', () => {
  it('returns metadataEntries for the given type and a single component name', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('myComp');

    const result = await inputComponentNames('LightningComponentBundle');

    expect(vscode.window.showInputBox).toHaveBeenCalledWith(expect.objectContaining({ ignoreFocusOut: true }));
    expect(result).toEqual(['LightningComponentBundle:myComp']);
  });

  it('returns metadataEntries for multiple comma-separated component names', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('comp1, comp2, comp3');

    const result = await inputComponentNames('LightningComponentBundle');

    expect(result).toEqual([
      'LightningComponentBundle:comp1',
      'LightningComponentBundle:comp2',
      'LightningComponentBundle:comp3'
    ]);
  });

  it('returns a single wildcard entry when * is entered', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('*');

    const result = await inputComponentNames('LightningComponentBundle');

    expect(result).toEqual(['LightningComponentBundle:*']);
  });

  it('strips double quotes from component names', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('"comp1", "comp2"');

    const result = await inputComponentNames('LightningComponentBundle');

    expect(result).toEqual(['LightningComponentBundle:comp1', 'LightningComponentBundle:comp2']);
  });

  it('deduplicates quoted and unquoted versions of the same name', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('"ankerplug", ankerplug');

    const result = await inputComponentNames('LightningComponentBundle');

    expect(result).toEqual(['LightningComponentBundle:ankerplug']);
  });

  it('deduplicates repeated component names', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('comp1, comp2, comp1');

    const result = await inputComponentNames('LightningComponentBundle');

    expect(result).toEqual(['LightningComponentBundle:comp1', 'LightningComponentBundle:comp2']);
  });

  it('returns undefined when the user cancels the input box', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue(undefined);

    const result = await inputComponentNames('LightningComponentBundle');

    expect(result).toBeUndefined();
  });

  it('returns the validation message when input is blank', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('myComp');
    await inputComponentNames('LightningComponentBundle');

    const call = (vscode.window.showInputBox as jest.Mock).mock.calls[0][0];
    expect(call.validateInput('   ')).toBe('Component name is required');
    expect(call.validateInput('myComp')).toBeNull();
  });
});
