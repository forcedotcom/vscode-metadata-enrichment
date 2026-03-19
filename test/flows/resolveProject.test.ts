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
import { resolveProject } from '../../src/flows/resolveProject';

jest.mock('@salesforce/core', () => ({
  SfProject: { resolve: jest.fn() }
}));

describe('resolveProject', () => {
  it('resolves the SfProject for the first workspace folder', async () => {
    const mockProject = { getPath: () => '/workspace' };
    (SfProject.resolve as jest.Mock).mockResolvedValue(mockProject);

    const result = await resolveProject();

    expect(SfProject.resolve).toHaveBeenCalledWith('/workspace');
    expect(result).toBe(mockProject);
  });

  it('shows an error and returns undefined when no workspace folder is open', async () => {
    const original = vscode.workspace.workspaceFolders;
    (vscode.workspace as any).workspaceFolders = undefined;

    const result = await resolveProject();

    expect(result).toBeUndefined();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('No workspace folder')
    );
    expect(SfProject.resolve).not.toHaveBeenCalled();

    (vscode.workspace as any).workspaceFolders = original;
  });
});
