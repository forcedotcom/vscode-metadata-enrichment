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
import { pickMetadataType } from '../flows/inputMetadataType';
import { inputComponentNames } from '../flows/inputComponentNames';
import { pickOrgAndConnect } from '../flows/connectToOrg';
import { resolveProject } from '../flows/resolveProject';
import { buildEligibleComponents } from '../flows/buildEligibleComponents';
import { getOutputChannel } from '../utils/outputChannel';
import { executeEnrichment } from '../flows/executeEnrichment';
import { METADATA_ENRICH_COMMAND } from '../constants/constants';
import { getMessage } from '../utils/localization';

/**
 * COMMAND - Metadata Enrichment Command
 * 
 * Enrich metadata in VS Code via a guided workflow triggered from the Command Palette.
 * User inputs the metadata type, the target component name(s), and the target org.
 * Metadata enrichment executes and writes results to corresponding local project metadata file(s).
 */
export const registerMetadataEnrichCommand = (): vscode.Disposable => {
  return vscode.commands.registerCommand(METADATA_ENRICH_COMMAND, async () => {

    /**
     * Step #1 - Prompt user to input a target metadata type to enrich
     */
    const typeItem = await pickMetadataType();
    if (!typeItem) {
      vscode.window.showInformationMessage(getMessage('command.metadata.enrich.cancelled'));
      return;
    }

    /**
     * Step #2 - Prompt user to input target component name(s) to enrich
     */
    const metadataEntries = await inputComponentNames(typeItem.label);
    if (!metadataEntries) {
      vscode.window.showInformationMessage(getMessage('command.metadata.enrich.cancelled'));
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

    /**
     * Step #4 - Resolve the DX project folder and retrieve the project instance
     */
    const project = await resolveProject();
    if (!project) {
      return;
    }
    const outputChannel = getOutputChannel();

    /**
     * Step #5 - Gather eligible components based on input params and execute metadata enrichment 
     *           Keep user updated with progress with final results printed to console
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
          outputChannel.appendLine(getMessage('command.metadata.enrich.log.starting', metadataEntries.join(', ')));
          outputChannel.appendLine(getMessage('command.metadata.enrich.log.targetOrg', orgResult.username));

          const eligibleResult = await buildEligibleComponents(metadataEntries, project, outputChannel);
          if (!eligibleResult) {
            return;
          }

          const { enrichmentRecords, componentsEligibleToProcess } = eligibleResult;
          outputChannel.appendLine(
            getMessage('command.metadata.enrich.log.eligibleComponents', String(componentsEligibleToProcess.length))
          );

          await executeEnrichment(componentsEligibleToProcess, enrichmentRecords, orgResult.connection, outputChannel, progress);
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
