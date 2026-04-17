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
import { pickMetadataType } from '../../src/flows/inputMetadataType';

describe('pickMetadataType', () => {
  it('returns the selected QuickPickItem', async () => {
    const selectedItem = { label: 'LightningComponentBundle', description: 'Lightning Web Component (LWC)' };
    (vscode.window.showQuickPick as jest.Mock).mockResolvedValue(selectedItem);

    const result = await pickMetadataType();

    expect(vscode.window.showQuickPick).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ label: 'CustomObject' }),
        expect.objectContaining({ label: 'LightningComponentBundle' })
      ]),
      expect.objectContaining({ ignoreFocusOut: true })
    );
    expect(result).toBe(selectedItem);
  });

  it('only exposes CustomObject and LightningComponentBundle as supported types', async () => {
    (vscode.window.showQuickPick as jest.Mock).mockResolvedValue(undefined);

    await pickMetadataType();

    const [items] = (vscode.window.showQuickPick as jest.Mock).mock.calls.at(-1) as [{ label: string }[]];
    const labels = items.map(i => i.label).sort();
    expect(labels).toEqual(['CustomObject', 'LightningComponentBundle']);
  });
});
