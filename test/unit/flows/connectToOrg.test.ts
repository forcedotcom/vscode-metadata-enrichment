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
import { AuthInfo, Org } from '@salesforce/core';
import { pickOrgAndConnect } from '../../../src/flows/connectToOrg';

jest.mock('@salesforce/core', () => ({
  AuthInfo: { listAllAuthorizations: jest.fn() },
  Org: { create: jest.fn() }
}));

describe('pickOrgAndConnect', () => {
  it('returns the username and connection for the selected org', async () => {
    const mockConnection = { sobject: jest.fn() } as any;
    (AuthInfo.listAllAuthorizations as jest.Mock).mockResolvedValue([
      { username: 'user@test.com', aliases: ['myalias'] }
    ]);
    (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({ label: 'user@test.com' });
    (Org.create as jest.Mock).mockResolvedValue({ getConnection: () => mockConnection });

    const result = await pickOrgAndConnect();

    expect(result).toEqual({ username: 'user@test.com', connection: mockConnection });
    expect(Org.create).toHaveBeenCalledWith({ aliasOrUsername: 'user@test.com' });
  });

  it('shows an error and returns undefined when no authenticated orgs are found', async () => {
    (AuthInfo.listAllAuthorizations as jest.Mock).mockResolvedValue([]);

    const result = await pickOrgAndConnect();

    expect(result).toBeUndefined();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('No authenticated Salesforce orgs found')
    );
    expect(Org.create).not.toHaveBeenCalled();
  });

  it('shows an error and returns undefined when Org.create throws', async () => {
    (AuthInfo.listAllAuthorizations as jest.Mock).mockResolvedValue([{ username: 'user@test.com', aliases: [] }]);
    (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({ label: 'user@test.com' });
    (Org.create as jest.Mock).mockRejectedValue(new Error('Auth file corrupted'));

    const result = await pickOrgAndConnect();

    expect(result).toBeUndefined();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining('Auth file corrupted'));
  });

  it('returns undefined when the user cancels the org QuickPick', async () => {
    (AuthInfo.listAllAuthorizations as jest.Mock).mockResolvedValue([{ username: 'user@test.com', aliases: [] }]);
    (vscode.window.showQuickPick as jest.Mock).mockResolvedValue(undefined);

    const result = await pickOrgAndConnect();

    expect(result).toBeUndefined();
    expect(Org.create).not.toHaveBeenCalled();
  });
});
