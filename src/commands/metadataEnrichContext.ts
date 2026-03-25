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
import { buildEligibleComponentsFromPath, isInsidePackageDirectory } from '../flows/buildEligibleComponents';
import { executeEnrichment } from '../flows/executeEnrichment';
import { getOutputChannel } from '../utils/outputChannel';
import { getMessage } from '../utils/localization';

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
     * Step #2 - Validate the selected path is inside a package directory but not at the
     *           package directory root or above (prevents enriching the entire project)
     */
    if (!isInsidePackageDirectory(uri.fsPath, project)) {
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
     * Steps #4–5 - Resolve eligible components from the selected path and execute enrichment.
     *              Keep user updated with progress with final results printed to console.
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
