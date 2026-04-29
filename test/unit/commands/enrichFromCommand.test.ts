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
import { METADATA_ENRICH_COMMAND } from '../../../src/constants/constants';
import { registerMetadataEnrichCommand } from '../../../src/commands/enrichFromCommand';

jest.mock('../../../src/flows/inputMetadataType', () => ({ pickMetadataType: jest.fn() }));
jest.mock('../../../src/flows/inputComponentNames', () => ({ inputComponentNames: jest.fn() }));
jest.mock('../../../src/flows/connectToOrg', () => ({ pickOrgAndConnect: jest.fn() }));
jest.mock('../../../src/flows/resolveProject', () => ({ resolveProject: jest.fn() }));
jest.mock('../../../src/flows/buildEligibleComponents', () => ({ buildEligibleComponents: jest.fn() }));
jest.mock('../../../src/utils/outputChannel', () => ({
  getOutputChannel: jest.fn().mockReturnValue({ appendLine: jest.fn(), show: jest.fn() })
}));
jest.mock('../../../src/flows/executeEnrichment', () => ({
  executeEnrichment: jest.fn().mockResolvedValue(undefined)
}));

import { pickMetadataType } from '../../../src/flows/inputMetadataType';
import { inputComponentNames } from '../../../src/flows/inputComponentNames';
import { pickOrgAndConnect } from '../../../src/flows/connectToOrg';
import { resolveProject } from '../../../src/flows/resolveProject';
import { buildEligibleComponents } from '../../../src/flows/buildEligibleComponents';
import { executeEnrichment } from '../../../src/flows/executeEnrichment';
import { mockConnection } from '../__mocks__/mocks';

describe('registerMetadataEnrichCommand', () => {
  const mockComponent = { fullName: 'myComp', name: 'myComp' };
  const mockEligibleResult = {
    enrichmentRecords: {} as any,
    componentsEligibleToProcess: [mockComponent] as any[]
  };

  const registerAndGetHandler = () => {
    registerMetadataEnrichCommand();
    const registerSpy = vscode.commands.registerCommand as jest.Mock;
    expect(registerSpy).toHaveBeenCalledWith(METADATA_ENRICH_COMMAND, expect.any(Function));
    return registerSpy.mock.calls[0][1] as () => Promise<void>;
  };

  it('shows cancellation message and returns early when inputComponentNames returns undefined', async () => {
    (pickMetadataType as jest.Mock).mockResolvedValue({ label: 'LightningComponentBundle' });
    (inputComponentNames as jest.Mock).mockResolvedValue(undefined);

    const handler = registerAndGetHandler();
    await handler();

    expect(inputComponentNames).toHaveBeenCalled();
    expect(pickOrgAndConnect).not.toHaveBeenCalled();
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Metadata enrichment was cancelled.');
  });

  it('shows cancellation message and returns early when pickOrgAndConnect returns undefined', async () => {
    (pickMetadataType as jest.Mock).mockResolvedValue({ label: 'LightningComponentBundle' });
    (inputComponentNames as jest.Mock).mockResolvedValue(['LightningComponentBundle:myComp']);
    (pickOrgAndConnect as jest.Mock).mockResolvedValue(undefined);

    const handler = registerAndGetHandler();
    await handler();

    expect(pickOrgAndConnect).toHaveBeenCalled();
    expect(resolveProject).not.toHaveBeenCalled();
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Metadata enrichment was cancelled.');
  });

  it('shows cancellation message and returns early when resolveProject returns undefined', async () => {
    (pickMetadataType as jest.Mock).mockResolvedValue({ label: 'LightningComponentBundle' });
    (inputComponentNames as jest.Mock).mockResolvedValue(['LightningComponentBundle:myComp']);
    (pickOrgAndConnect as jest.Mock).mockResolvedValue({ username: 'user@test.com', connection: mockConnection });
    (resolveProject as jest.Mock).mockResolvedValue(undefined);

    const handler = registerAndGetHandler();
    await handler();

    expect(resolveProject).toHaveBeenCalled();
    expect(buildEligibleComponents).not.toHaveBeenCalled();
    expect(executeEnrichment).not.toHaveBeenCalled();
  });

  it('shows cancellation message and returns early when pickMetadataType returns undefined', async () => {
    (pickMetadataType as jest.Mock).mockResolvedValue(undefined);

    const handler = registerAndGetHandler();
    await handler();

    expect(inputComponentNames).not.toHaveBeenCalled();
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Metadata enrichment was cancelled.');
  });

  it('stops after buildEligibleComponents returns undefined and does not call executeEnrichment', async () => {
    (pickMetadataType as jest.Mock).mockResolvedValue({ label: 'LightningComponentBundle' });
    (inputComponentNames as jest.Mock).mockResolvedValue(['LightningComponentBundle:myComp']);
    (pickOrgAndConnect as jest.Mock).mockResolvedValue({ username: 'user@test.com', connection: mockConnection });
    (resolveProject as jest.Mock).mockResolvedValue({ getPath: () => '/workspace' });
    (buildEligibleComponents as jest.Mock).mockResolvedValue(undefined);
    (vscode.window.withProgress as jest.Mock).mockImplementation(
      async (_opts: any, task: (p: vscodeTypes.Progress<{ message?: string }>) => Promise<void>) => {
        return task({ report: jest.fn() });
      }
    );

    const handler = registerAndGetHandler();
    await handler();

    expect(buildEligibleComponents).toHaveBeenCalled();
    expect(executeEnrichment).not.toHaveBeenCalled();
  });

  it('calls each flow in sequence then executes enrichment', async () => {
    (pickMetadataType as jest.Mock).mockResolvedValue({ label: 'LightningComponentBundle' });
    (inputComponentNames as jest.Mock).mockResolvedValue(['LightningComponentBundle:myComp']);
    (pickOrgAndConnect as jest.Mock).mockResolvedValue({ username: 'user@test.com', connection: mockConnection });
    (resolveProject as jest.Mock).mockResolvedValue({ getPath: () => '/workspace' });
    (buildEligibleComponents as jest.Mock).mockResolvedValue(mockEligibleResult);
    (vscode.window.withProgress as jest.Mock).mockImplementation(
      async (_opts: any, task: (p: vscodeTypes.Progress<{ message?: string }>) => Promise<void>) => {
        return task({ report: jest.fn() });
      }
    );

    const handler = registerAndGetHandler();
    await handler();

    expect(pickMetadataType).toHaveBeenCalled();
    expect(inputComponentNames).toHaveBeenCalledWith('LightningComponentBundle');
    expect(pickOrgAndConnect).toHaveBeenCalled();
    expect(resolveProject).toHaveBeenCalled();
    expect(buildEligibleComponents).toHaveBeenCalled();
    expect(executeEnrichment).toHaveBeenCalled();
  });
});
