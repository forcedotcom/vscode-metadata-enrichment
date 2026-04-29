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
import { executeEnrichment } from '../../../src/flows/executeEnrichment';
import { mockOutputChannel, mockProgress, mockConnection } from '../__mocks__/mocks';

jest.mock('@salesforce/metadata-enrichment', () => ({
  EnrichmentHandler: { enrich: jest.fn() },
  EnrichmentMetrics: { createEnrichmentMetrics: jest.fn() },
  FileProcessor: { updateMetadata: jest.fn() }
}));
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

describe('reportResults (via executeEnrichment)', () => {
  const runWithMetrics = async (metrics: object) => {
    (EnrichmentHandler.enrich as jest.Mock).mockResolvedValue([]);
    (FileProcessor.updateMetadata as jest.Mock).mockResolvedValue(new Set());
    (EnrichmentMetrics.createEnrichmentMetrics as jest.Mock).mockReturnValue(metrics);
    const mockEnrichmentRecords = { updateWithResults: jest.fn(), recordSet: new Map() } as any;
    await executeEnrichment(
      mockComponents,
      mockEnrichmentRecords,
      mockConnection,
      mockOutputChannel as any,
      mockProgress as any
    );
  };

  it('writes summary lines and shows a success notification', async () => {
    await runWithMetrics(mockMetrics);

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('Enrichment complete. Total: 1'));
    expect(mockOutputChannel.show).toHaveBeenCalled();
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('1 component(s) enriched successfully')
    );
  });

  it('logs skipped and failed component rows and shows a warning when there are failures', async () => {
    await runWithMetrics({
      total: 3,
      success: {
        count: 1,
        components: [
          { typeName: 'LightningComponentBundle', componentName: 'goodComp', requestId: 'req-1', message: '' }
        ]
      },
      skipped: {
        count: 1,
        components: [
          {
            typeName: 'LightningComponentBundle',
            componentName: 'skippedComp',
            requestId: '',
            message: 'Already up to date'
          }
        ]
      },
      fail: {
        count: 1,
        components: [
          {
            typeName: 'LightningComponentBundle',
            componentName: 'failedComp',
            requestId: 'req-2',
            message: 'Enrichment API error'
          }
        ]
      }
    });

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('skippedComp'));
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('Skipped'));
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('Message: Already up to date'));
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('failedComp'));
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('Failed'));
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('Message: Enrichment API error'));
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(expect.stringContaining('1 failure(s)'));
  });

  it('logs a component message field when it is non-empty', async () => {
    await runWithMetrics({
      total: 1,
      success: {
        count: 1,
        components: [
          {
            typeName: 'CustomObject',
            componentName: 'MyObject__c',
            requestId: 'req-3',
            message: 'Field populated from org'
          }
        ]
      },
      skipped: { count: 0, components: [] },
      fail: { count: 0, components: [] }
    });

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringContaining('Message: Field populated from org')
    );
  });
});
