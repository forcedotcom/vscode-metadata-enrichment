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
import { EnrichmentHandler, EnrichmentMetrics, FileProcessor } from '@salesforce/metadata-enrichment';
import { executeEnrichment, reportResults } from '../../src/flows/executeEnrichment';

jest.mock('@salesforce/metadata-enrichment', () => ({
  EnrichmentHandler: { enrich: jest.fn() },
  EnrichmentMetrics: { createEnrichmentMetrics: jest.fn() },
  FileProcessor: { updateMetadata: jest.fn() }
}));

const mockOutputChannel = { appendLine: jest.fn(), show: jest.fn() };
const mockProgress = { report: jest.fn() };
const mockConnection = {} as any;
const mockComponents = [{ fullName: 'myComp', name: 'myComp' }] as any[];

const mockEnrichmentResults = [{ componentName: 'myComp', status: 'success' }];
const mockMetrics = {
  total: 1,
  success: {
    count: 1,
    components: [{ typeName: 'LightningComponentBundle', componentName: 'myComp', requestId: 'req-1', message: '' }]
  },
  skipped: { count: 0, components: [] },
  fail: { count: 0, components: [] }
};

describe('executeEnrichment', () => {
  it('runs enrich and file update stages then reports results', async () => {
    (EnrichmentHandler.enrich as jest.Mock).mockResolvedValue(mockEnrichmentResults);
    (FileProcessor.updateMetadata as jest.Mock).mockResolvedValue(new Set(mockEnrichmentResults));
    (EnrichmentMetrics.createEnrichmentMetrics as jest.Mock).mockReturnValue(mockMetrics);
    const mockEnrichmentRecords = { updateWithResults: jest.fn(), recordSet: new Map() } as any;

    await executeEnrichment(
      mockComponents,
      mockEnrichmentRecords,
      mockConnection,
      mockOutputChannel as any,
      mockProgress as any
    );

    expect(mockProgress.report).toHaveBeenCalledTimes(2);
    expect(EnrichmentHandler.enrich).toHaveBeenCalledWith(mockConnection, mockComponents);
    expect(FileProcessor.updateMetadata).toHaveBeenCalledWith(mockComponents, mockEnrichmentRecords.recordSet);
    expect(mockEnrichmentRecords.updateWithResults).toHaveBeenCalledTimes(2);
  });
});

describe('reportResults', () => {
  it('writes summary lines and shows a success notification', () => {
    (vscode.window.showInformationMessage as jest.Mock).mockReturnValue(undefined);

    reportResults(mockOutputChannel as any, mockMetrics as any, new Map());

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringContaining('Enrichment complete. Total: 1')
    );
    expect(mockOutputChannel.show).toHaveBeenCalled();
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('1 component(s) enriched successfully')
    );
  });

  it('prints the generated description when present in the description map', () => {
    const descriptionMap = new Map([['myComp', 'Manages contact records and related data.']]);

    reportResults(mockOutputChannel as any, mockMetrics as any, descriptionMap);

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringContaining('Manages contact records and related data.')
    );
  });
});
