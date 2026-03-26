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
import { METADATA_ENRICH_CONTEXT_COMMAND } from '../constants/constants';
import { resolveProject } from '../flows/resolveProject';
import { pickOrgAndConnect } from '../flows/connectToOrg';
import { buildEligibleComponentsFromPath } from '../flows/buildEligibleComponents';
import { isEligibleEnrichmentPath } from '../utils/pathValidator';
import { executeEnrichment } from '../flows/executeEnrichment';
import { getOutputChannel } from '../utils/outputChannel';
import { getMessage } from '../utils/localization';

/**
 * COMMAND - Metadata Enrichment Context Menu Action
 *
 * Enrich metadata in VS Code from the context menu of a file or folder in the local project.
 * Components within the context of the trigger point will be enriched, for example if triggered from:
 *     File -> enriches the corresponding component the file belongs to
 *     Folder -> enriches all components within the folder if it is a component type folder (e.g. lwc/, objects/, etc.)
 * Metadata enrichment executes and writes results to corresponding local project metadata file(s).
 */
export const registerMetadataEnrichContextCommand = (): vscode.Disposable => {
  return vscode.commands.registerCommand(METADATA_ENRICH_CONTEXT_COMMAND, async (uri?: vscode.Uri) => {
    if (!uri) {
      vscode.window.showErrorMessage(getMessage('command.metadata.enrich.context.error.noSelection'));
      return;
    }

    /**
     * Step #1 - Resolve the DX project folder and retrieve the project instance
     */
    const project = await resolveProject();
    if (!project) {
      return;
    }

    /**
     * Step #2 - Validate the selected path is in a valid enrichment context
     */
    if (!isEligibleEnrichmentPath(uri.fsPath, project)) {
      vscode.window.showErrorMessage(getMessage('command.metadata.enrich.context.error.invalidPath'));
      return;
    }

    /**
     * Step #3 - Prompt user to select the target org
     */
    const orgResult = await pickOrgAndConnect();
    if (!orgResult) {
      vscode.window.showInformationMessage(getMessage('command.metadata.enrich.cancelled'));
      return;
    }

    const outputChannel = getOutputChannel();

    /**
     * Steps #4 - Resolve eligible components from the selected path and execute enrichment.
     *            Keep user updated with progress with final results printed to console.
     */
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: getMessage('command.metadata.enrich.progress.title'),
          cancellable: false
        },
        async progress => {
          progress.report({ message: getMessage('command.metadata.enrich.progress.setup') });
          outputChannel.appendLine('');
          outputChannel.appendLine(getMessage('command.metadata.enrich.context.log.starting', uri.fsPath));
          outputChannel.appendLine(getMessage('command.metadata.enrich.log.targetOrg', orgResult.username));

          const eligibleResult = await buildEligibleComponentsFromPath(uri.fsPath, project, outputChannel);
          if (!eligibleResult) {
            return;
          }

          const { enrichmentRecords, componentsEligibleToProcess } = eligibleResult;
          outputChannel.appendLine(
            getMessage('command.metadata.enrich.log.eligibleComponents', String(componentsEligibleToProcess.length))
          );

          await executeEnrichment(
            componentsEligibleToProcess,
            enrichmentRecords,
            orgResult.connection,
            outputChannel,
            progress
          );
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(getMessage('command.metadata.enrich.error.failed', message));
      outputChannel.appendLine(getMessage('command.metadata.enrich.log.error', message));
      outputChannel.show();
    }
  });
};
