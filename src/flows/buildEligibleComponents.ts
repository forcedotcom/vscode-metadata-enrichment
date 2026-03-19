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
import { SfProject } from '@salesforce/core';
import type { SourceComponent } from '@salesforce/source-deploy-retrieve';
import { ComponentSetBuilder } from '@salesforce/source-deploy-retrieve';
import { EnrichmentRecords, SourceComponentProcessor } from '@salesforce/metadata-enrichment';
import { getMessage } from '../utils/localization';

export type EligibleComponents = {
  enrichmentRecords: EnrichmentRecords;
  componentsEligibleToProcess: SourceComponent[];
};

export async function buildEligibleComponents(
  metadataEntries: string[],
  project: SfProject,
  outputChannel: vscode.OutputChannel
): Promise<EligibleComponents | undefined> {
  const projectComponentSet = await ComponentSetBuilder.build({
    metadata: {
      metadataEntries,
      directoryPaths: [project.getPath()]
    }
  });

  const projectSourceComponents = projectComponentSet.getSourceComponents().toArray();

  if (projectSourceComponents.length === 0) {
    vscode.window.showWarningMessage(
      getMessage('No components found matching "{0}". Verify the type and component name are correct.', metadataEntries[0])
    );
    outputChannel.appendLine(getMessage('[Metadata Enrichment] No components found for "{0}".', metadataEntries[0]));
    outputChannel.show();
    return undefined;
  }

  outputChannel.appendLine(
    getMessage('[Metadata Enrichment] Found {0} component(s). Checking eligibility...', String(projectSourceComponents.length))
  );

  const enrichmentRecords = new EnrichmentRecords(projectSourceComponents);

  const componentsToSkip = SourceComponentProcessor.getComponentsToSkip(
    projectSourceComponents,
    metadataEntries,
    project.getPath()
  );
  enrichmentRecords.addRecords(componentsToSkip);

  const componentsEligibleToProcess = projectSourceComponents.filter(component => {
    const name = component.fullName ?? component.name;
    if (!name) {
      return false;
    }
    for (const skip of componentsToSkip) {
      if (skip.componentName === name) {
        return false;
      }
    }
    return true;
  });

  if (componentsEligibleToProcess.length === 0) {
    vscode.window.showWarningMessage(getMessage('All matched components were skipped. Check the Output panel for details.'));
    outputChannel.appendLine(getMessage('[Metadata Enrichment] All components were skipped.'));
    outputChannel.show();
    return undefined;
  }

  return { enrichmentRecords, componentsEligibleToProcess };
}
