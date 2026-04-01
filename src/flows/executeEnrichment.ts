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

import { type OutputChannel, type Progress, window } from 'vscode';
import type { Connection } from '@salesforce/core';
import type { SourceComponent } from '@salesforce/source-deploy-retrieve';
import {
  EnrichmentHandler,
  EnrichmentMetrics,
  type EnrichmentRecords,
  FileProcessor
} from '@salesforce/metadata-enrichment';
import { getMessage } from '../utils/localization';

/**
 * FLOW - Execute Enrichment
 *
 * Executes enrichment for the given project source components and org connection.
 * Reports formatted results to the output channel and also displays pop-up messages to the user.
 */
export async function executeEnrichment(
  componentsEligibleToProcess: SourceComponent[],
  enrichmentRecords: EnrichmentRecords,
  connection: Connection,
  outputChannel: OutputChannel,
  progress: Progress<{ message?: string }>
): Promise<void> {
  progress.report({ message: getMessage('command.metadata.enrich.progress.executing') });
  const enrichmentResults = await EnrichmentHandler.enrich(connection, componentsEligibleToProcess);
  enrichmentRecords.updateWithResults(enrichmentResults);

  progress.report({ message: getMessage('command.metadata.enrich.progress.updating') });
  const fileUpdatedRecords = await FileProcessor.updateMetadata(
    componentsEligibleToProcess,
    enrichmentRecords.recordSet
  );
  enrichmentRecords.updateWithResults(Array.from(fileUpdatedRecords));

  const metrics = EnrichmentMetrics.createEnrichmentMetrics(Array.from(enrichmentRecords.recordSet));
  reportResults(outputChannel, metrics);
}

function reportResults(outputChannel: OutputChannel, metrics: EnrichmentMetrics): void {
  outputChannel.appendLine('');
  outputChannel.appendLine(
    getMessage(
      'command.metadata.enrich.log.complete',
      String(metrics.total),
      String(metrics.success.count),
      String(metrics.skipped.count),
      String(metrics.fail.count)
    )
  );

  if (metrics.total > 0) {
    const allRows = [
      ...metrics.success.components.map(c => ({ status: getMessage('command.metadata.enrich.status.success'), ...c })),
      ...metrics.skipped.components.map(c => ({ status: getMessage('command.metadata.enrich.status.skipped'), ...c })),
      ...metrics.fail.components.map(c => ({ status: getMessage('command.metadata.enrich.status.failed'), ...c }))
    ];

    for (const row of allRows) {
      outputChannel.appendLine('');
      outputChannel.appendLine(
        `  ${getMessage('command.metadata.enrich.log.component', row.typeName, row.componentName)}`
      );
      outputChannel.appendLine(`    ${getMessage('command.metadata.enrich.log.field.status', row.status)}`);
      if (row.requestId) {
        outputChannel.appendLine(`    ${getMessage('command.metadata.enrich.log.field.requestId', row.requestId)}`);
      }
      if (row.message) {
        outputChannel.appendLine(`    ${getMessage('command.metadata.enrich.log.field.message', row.message)}`);
      }
    }
  }

  outputChannel.appendLine('');
  outputChannel.show();

  if (metrics.fail.count > 0) {
    window.showWarningMessage(
      getMessage('command.metadata.enrich.warn.completedWithFailures', String(metrics.fail.count))
    );
  } else if (metrics.success.count > 0) {
    window.showInformationMessage(getMessage('command.metadata.enrich.info.success', String(metrics.success.count)));
  } else {
    window.showInformationMessage(getMessage('command.metadata.enrich.info.allSkipped'));
  }
}
