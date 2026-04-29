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

import type * as vscodeTypes from 'vscode';
const vscode = require('vscode') as typeof import('vscode');
import { METADATA_ENRICH_CONTEXT_COMMAND } from '../../../src/constants/constants';
import { registerMetadataEnrichContextCommand } from '../../../src/commands/enrichFromContextMenu';

jest.mock('../../src/flows/resolveProject', () => ({ resolveProject: jest.fn() }));
jest.mock('../../src/flows/connectToOrg', () => ({ pickOrgAndConnect: jest.fn() }));
jest.mock('../../src/flows/buildEligibleComponents', () => ({ buildEligibleComponentsFromPath: jest.fn() }));
jest.mock('../../src/utils/pathValidator', () => ({ isEligibleEnrichmentPath: jest.fn() }));
jest.mock('../../src/utils/outputChannel', () => ({
  getOutputChannel: jest.fn().mockReturnValue({ appendLine: jest.fn(), show: jest.fn() })
}));
jest.mock('../../src/flows/executeEnrichment', () => ({
  executeEnrichment: jest.fn().mockResolvedValue(undefined)
}));

import { resolveProject } from '../../../src/flows/resolveProject';
import { pickOrgAndConnect } from '../../../src/flows/connectToOrg';
import { buildEligibleComponentsFromPath } from '../../../src/flows/buildEligibleComponents';
import { isEligibleEnrichmentPath } from '../../../src/utils/pathValidator';
import { executeEnrichment } from '../../../src/flows/executeEnrichment';
import { mockConnection } from '../../e2e/__mocks__/mocks';

describe('registerMetadataEnrichContextCommand', () => {
  const mockUri = { fsPath: '/workspace/force-app/main/default/lwc/myComp' } as vscodeTypes.Uri;
  const mockProject = {} as any;
  const mockEligibleResult = {
    enrichmentRecords: {} as any,
    componentsEligibleToProcess: [{ fullName: 'myComp', name: 'myComp' }] as any[]
  };

  const registerAndGetHandler = () => {
    registerMetadataEnrichContextCommand();
    const registerSpy = vscode.commands.registerCommand as jest.Mock;
    expect(registerSpy).toHaveBeenCalledWith(METADATA_ENRICH_CONTEXT_COMMAND, expect.any(Function));
    return registerSpy.mock.calls[0][1] as (uri?: vscodeTypes.Uri) => Promise<void>;
  };

  it('shows error and returns early when no uri is provided', async () => {
    const handler = registerAndGetHandler();
    await handler(undefined);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(expect.any(String));
    expect(resolveProject).not.toHaveBeenCalled();
  });

  it('returns early when resolveProject returns undefined', async () => {
    (resolveProject as jest.Mock).mockResolvedValue(undefined);

    const handler = registerAndGetHandler();
    await handler(mockUri);

    expect(resolveProject).toHaveBeenCalled();
    expect(isEligibleEnrichmentPath).not.toHaveBeenCalled();
  });

  it('shows error and returns early when path is not eligible for enrichment', async () => {
    (resolveProject as jest.Mock).mockResolvedValue(mockProject);
    (isEligibleEnrichmentPath as jest.Mock).mockReturnValue(false);

    const handler = registerAndGetHandler();
    await handler(mockUri);

    expect(isEligibleEnrichmentPath).toHaveBeenCalledWith(mockUri.fsPath, mockProject);
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(expect.any(String));
    expect(pickOrgAndConnect).not.toHaveBeenCalled();
  });

  it('shows cancellation message and returns early when pickOrgAndConnect returns undefined', async () => {
    (resolveProject as jest.Mock).mockResolvedValue(mockProject);
    (isEligibleEnrichmentPath as jest.Mock).mockReturnValue(true);
    (pickOrgAndConnect as jest.Mock).mockResolvedValue(undefined);

    const handler = registerAndGetHandler();
    await handler(mockUri);

    expect(pickOrgAndConnect).toHaveBeenCalled();
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(expect.any(String));
    expect(executeEnrichment).not.toHaveBeenCalled();
  });

  it('stops after buildEligibleComponentsFromPath returns undefined and does not call executeEnrichment', async () => {
    (resolveProject as jest.Mock).mockResolvedValue(mockProject);
    (isEligibleEnrichmentPath as jest.Mock).mockReturnValue(true);
    (pickOrgAndConnect as jest.Mock).mockResolvedValue({ username: 'user@test.com', connection: mockConnection });
    (buildEligibleComponentsFromPath as jest.Mock).mockResolvedValue(undefined);
    (vscode.window.withProgress as jest.Mock).mockImplementation(
      async (_opts: any, task: (p: vscodeTypes.Progress<{ message?: string }>) => Promise<void>) => {
        return task({ report: jest.fn() });
      }
    );

    const handler = registerAndGetHandler();
    await handler(mockUri);

    expect(buildEligibleComponentsFromPath).toHaveBeenCalled();
    expect(executeEnrichment).not.toHaveBeenCalled();
  });

  it('calls each flow in sequence then executes enrichment', async () => {
    (resolveProject as jest.Mock).mockResolvedValue(mockProject);
    (isEligibleEnrichmentPath as jest.Mock).mockReturnValue(true);
    (pickOrgAndConnect as jest.Mock).mockResolvedValue({ username: 'user@test.com', connection: mockConnection });
    (buildEligibleComponentsFromPath as jest.Mock).mockResolvedValue(mockEligibleResult);
    (vscode.window.withProgress as jest.Mock).mockImplementation(
      async (_opts: any, task: (p: vscodeTypes.Progress<{ message?: string }>) => Promise<void>) => {
        return task({ report: jest.fn() });
      }
    );

    const handler = registerAndGetHandler();
    await handler(mockUri);

    expect(resolveProject).toHaveBeenCalled();
    expect(isEligibleEnrichmentPath).toHaveBeenCalledWith(mockUri.fsPath, mockProject);
    expect(pickOrgAndConnect).toHaveBeenCalled();
    expect(buildEligibleComponentsFromPath).toHaveBeenCalled();
    expect(executeEnrichment).toHaveBeenCalled();
  });
});
