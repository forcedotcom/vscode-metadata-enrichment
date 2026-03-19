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
import type { Connection } from '@salesforce/core';
import type { SourceComponent } from '@salesforce/source-deploy-retrieve';
import { EnrichmentHandler, EnrichmentMetrics, EnrichmentRecords, FileProcessor } from '@salesforce/metadata-enrichment';
import { getMessage } from '../utils/localization';

/**
 * Runs stages 2 and 3 of the enrichment pipeline (enrich + update files) and
 * reports results to the output channel.  Callers are responsible for stage 1
 * (building the component set, skip detection, and filtering eligible components).
 */
export async function executeEnrichment(
  componentsEligibleToProcess: SourceComponent[],
  enrichmentRecords: EnrichmentRecords,
  connection: Connection,
  outputChannel: vscode.OutputChannel,
  progress: vscode.Progress<{ message?: string }>
): Promise<void> {
  progress.report({ message: getMessage('Sending enrichment requests...') });
  const enrichmentResults = await EnrichmentHandler.enrich(connection, componentsEligibleToProcess);
  enrichmentRecords.updateWithResults(enrichmentResults);

  progress.report({ message: getMessage('Updating metadata files...') });
  const fileUpdatedRecords = await FileProcessor.updateMetadata(componentsEligibleToProcess, enrichmentRecords.recordSet);
  enrichmentRecords.updateWithResults(Array.from(fileUpdatedRecords));

  const metrics = EnrichmentMetrics.createEnrichmentMetrics(Array.from(enrichmentRecords.recordSet));
  reportResults(outputChannel, metrics);
}

export function reportResults(outputChannel: vscode.OutputChannel, metrics: EnrichmentMetrics): void {
  const colWidths = { status: 10, type: 30, component: 40, requestId: 38, message: 50 };
  const separator = '-'.repeat(
    colWidths.status + colWidths.type + colWidths.component + colWidths.requestId + colWidths.message + 8
  );

  const padCol = (str: string, width: number) => (str ?? '').slice(0, width).padEnd(width);

  const header =
    `${padCol('Status', colWidths.status)}  ` +
    `${padCol('Type', colWidths.type)}  ` +
    `${padCol('Component', colWidths.component)}  ` +
    `${padCol('Request ID', colWidths.requestId)}  ` +
    `${padCol('Message', colWidths.message)}`;

  outputChannel.appendLine('');
  outputChannel.appendLine(`[Metadata Enrichment] Enrichment complete. Total: ${metrics.total}`);
  outputChannel.appendLine(
    `  Success: ${metrics.success.count}  |  Skipped: ${metrics.skipped.count}  |  Failed: ${metrics.fail.count}`
  );

  if (metrics.total > 0) {
    outputChannel.appendLine('');
    outputChannel.appendLine(header);
    outputChannel.appendLine(separator);

    const allRows = [
      ...metrics.success.components.map(c => ({ status: 'Success', ...c })),
      ...metrics.skipped.components.map(c => ({ status: 'Skipped', ...c })),
      ...metrics.fail.components.map(c => ({ status: 'Failed', ...c }))
    ];

    for (const row of allRows) {
      outputChannel.appendLine(
        `${padCol(row.status, colWidths.status)}  ` +
          `${padCol(row.typeName, colWidths.type)}  ` +
          `${padCol(row.componentName, colWidths.component)}  ` +
          `${padCol(row.requestId ?? '', colWidths.requestId)}  ` +
          `${padCol(row.message ?? '', colWidths.message)}`
      );
    }
  }

  outputChannel.appendLine('');
  outputChannel.show();

  if (metrics.fail.count > 0) {
    vscode.window.showWarningMessage(
      getMessage('Metadata enrichment completed with {0} failure(s). See Output panel for details.', String(metrics.fail.count))
    );
  } else if (metrics.success.count > 0) {
    vscode.window.showInformationMessage(
      getMessage('Metadata enrichment complete. {0} component(s) enriched successfully.', String(metrics.success.count))
    );
  } else {
    vscode.window.showInformationMessage(
      getMessage('Metadata enrichment complete. No components were enriched (all skipped).')
    );
  }
}
