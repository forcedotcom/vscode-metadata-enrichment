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

import { ComponentSetBuilder } from '@salesforce/source-deploy-retrieve';
import { EnrichmentRecords, SourceComponentProcessor } from '@salesforce/metadata-enrichment';
import { buildEligibleComponents, buildEligibleComponentsFromPath } from '../../../src/flows/buildEligibleComponents';
import { mockOutputChannel, mockProject } from '../../e2e/__mocks__/mocks';

jest.mock('@salesforce/source-deploy-retrieve', () => ({
  ComponentSetBuilder: { build: jest.fn() },
  RegistryAccess: jest.fn()
}));

jest.mock('@salesforce/metadata-enrichment', () => ({
  EnrichmentRecords: jest.fn().mockImplementation(() => ({ addRecords: jest.fn(), recordSet: new Map() })),
  SourceComponentProcessor: { getComponentsToSkip: jest.fn().mockReturnValue(new Set()) }
}));
const metadataEntries = ['LightningComponentBundle:myComp'];
const mockComponent = { fullName: 'myComp', name: 'myComp', type: { name: 'LightningComponentBundle' } };

describe('buildEligibleComponents', () => {
  it('returns enrichmentRecords and eligible components', async () => {
    (ComponentSetBuilder.build as jest.Mock).mockResolvedValue({
      getSourceComponents: () => ({ toArray: () => [mockComponent] })
    });

    const result = await buildEligibleComponents(metadataEntries, mockProject, mockOutputChannel as any);

    expect(result).not.toBeUndefined();
    expect(result!.componentsEligibleToProcess).toEqual([mockComponent]);
    expect(EnrichmentRecords).toHaveBeenCalledWith([mockComponent]);
    expect(SourceComponentProcessor.getComponentsToSkip).toHaveBeenCalled();
  });

  it('returns undefined and shows a warning when no source components are found', async () => {
    (ComponentSetBuilder.build as jest.Mock).mockResolvedValue({
      getSourceComponents: () => ({ toArray: () => [] })
    });

    const result = await buildEligibleComponents(metadataEntries, mockProject, mockOutputChannel as any);

    expect(result).toBeUndefined();
    expect(mockOutputChannel.show).toHaveBeenCalled();
  });

  it('returns undefined and shows a warning when all components are skipped', async () => {
    (ComponentSetBuilder.build as jest.Mock).mockResolvedValue({
      getSourceComponents: () => ({ toArray: () => [mockComponent] })
    });
    (SourceComponentProcessor.getComponentsToSkip as jest.Mock).mockReturnValue(new Set([{ componentName: 'myComp' }]));

    const result = await buildEligibleComponents(metadataEntries, mockProject, mockOutputChannel as any);

    expect(result).toBeUndefined();
    expect(mockOutputChannel.show).toHaveBeenCalled();
  });

  it('excludes components with no name from eligible components', async () => {
    const namelessComponent = { fullName: undefined, name: undefined, type: { name: 'LightningComponentBundle' } };
    (ComponentSetBuilder.build as jest.Mock).mockResolvedValue({
      getSourceComponents: () => ({ toArray: () => [namelessComponent] })
    });
    (SourceComponentProcessor.getComponentsToSkip as jest.Mock).mockReturnValue(new Set());

    const result = await buildEligibleComponents(metadataEntries, mockProject, mockOutputChannel as any);

    expect(result).toBeUndefined();
    expect(mockOutputChannel.show).toHaveBeenCalled();
  });
});

describe('buildEligibleComponentsFromPath', () => {
  beforeEach(() => {
    (SourceComponentProcessor.getComponentsToSkip as jest.Mock).mockReturnValue(new Set());
  });

  it('returns enrichmentRecords and eligible components when components are found at the path', async () => {
    (ComponentSetBuilder.build as jest.Mock).mockResolvedValue({
      getSourceComponents: () => ({ toArray: () => [mockComponent] })
    });

    const result = await buildEligibleComponentsFromPath(
      '/workspace/force-app/main/default/lwc',
      mockProject,
      mockOutputChannel as any
    );

    expect(result).not.toBeUndefined();
    expect(result!.componentsEligibleToProcess).toEqual([mockComponent]);
    expect(EnrichmentRecords).toHaveBeenCalledWith([mockComponent]);
    expect(SourceComponentProcessor.getComponentsToSkip).toHaveBeenCalled();
  });

  it('returns undefined and shows a warning when no components are found at the path', async () => {
    (ComponentSetBuilder.build as jest.Mock).mockResolvedValue({
      getSourceComponents: () => ({ toArray: () => [] })
    });

    const result = await buildEligibleComponentsFromPath(
      '/workspace/force-app/main/default/lwc',
      mockProject,
      mockOutputChannel as any
    );

    expect(result).toBeUndefined();
    expect(mockOutputChannel.show).toHaveBeenCalled();
  });

  it('returns undefined and shows a warning when all components at the path are skipped', async () => {
    (ComponentSetBuilder.build as jest.Mock).mockResolvedValue({
      getSourceComponents: () => ({ toArray: () => [mockComponent] })
    });
    (SourceComponentProcessor.getComponentsToSkip as jest.Mock).mockReturnValue(new Set([{ componentName: 'myComp' }]));

    const result = await buildEligibleComponentsFromPath(
      '/workspace/force-app/main/default/lwc',
      mockProject,
      mockOutputChannel as any
    );

    expect(result).toBeUndefined();
    expect(mockOutputChannel.show).toHaveBeenCalled();
  });
});
