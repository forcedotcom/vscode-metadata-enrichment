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
import { ComponentSetBuilder, type SourceComponent } from '@salesforce/source-deploy-retrieve';
import { EnrichmentRecords, SourceComponentProcessor } from '@salesforce/metadata-enrichment';
import { getMessage } from '../utils/localization';

export type EligibleComponents = {
  enrichmentRecords: EnrichmentRecords;
  componentsEligibleToProcess: SourceComponent[];
};

/**
 * FLOW - Build Eligible Components
 *
 * Given a list of metadata entries, digs through the local DX project and collates matching source components.
 * Also verifies if the components are eligible for enrichment.
 * Uses the common metadata-enrichment library to do the retrieval and eligibility checks.
 * Displays both pop-up and output channel messages to the user if components are not found or skipped.
 */
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
    vscode.window.showWarningMessage(getMessage('command.metadata.enrich.warn.noComponents', metadataEntries[0]));
    outputChannel.appendLine(getMessage('command.metadata.enrich.log.noComponents', metadataEntries[0]));
    outputChannel.show();
    return undefined;
  }

  outputChannel.appendLine(
    getMessage('command.metadata.enrich.log.foundComponents', String(projectSourceComponents.length))
  );

  const enrichmentRecords = new EnrichmentRecords(projectSourceComponents);

  const componentsToSkip = SourceComponentProcessor.getComponentsToSkip(
    projectSourceComponents,
    metadataEntries,
    project.getPath()
  );
  enrichmentRecords.addRecords(componentsToSkip);

  const componentsEligibleToProcess = filterEligibleComponents(projectSourceComponents, componentsToSkip);

  if (componentsEligibleToProcess.length === 0) {
    vscode.window.showWarningMessage(getMessage('command.metadata.enrich.warn.allSkipped'));
    outputChannel.appendLine(getMessage('command.metadata.enrich.log.allSkipped'));
    outputChannel.show();
    return undefined;
  }

  return { enrichmentRecords, componentsEligibleToProcess };
}

/**
 * FLOW - Build Eligible Components From Path
 *
 * Given a file system path (from a context menu selection), resolves the matching
 * source components using a sourcepath-based lookup and checks eligibility for enrichment.
 * Displays both pop-up and output channel messages if no components are found or all are skipped.
 */
export async function buildEligibleComponentsFromPath(
  fsPath: string,
  project: SfProject,
  outputChannel: vscode.OutputChannel
): Promise<EligibleComponents | undefined> {
  const projectComponentSet = await ComponentSetBuilder.build({
    sourcepath: [fsPath]
  });

  const projectSourceComponents = projectComponentSet.getSourceComponents().toArray();

  if (projectSourceComponents.length === 0) {
    vscode.window.showWarningMessage(getMessage('command.metadata.enrich.context.warn.noComponents'));
    outputChannel.appendLine(getMessage('command.metadata.enrich.context.log.noComponents'));
    outputChannel.show();
    return undefined;
  }

  outputChannel.appendLine(
    getMessage('command.metadata.enrich.log.foundComponents', String(projectSourceComponents.length))
  );

  const metadataEntries = projectSourceComponents.map(c => `${c.type.name}:${c.fullName ?? c.name}`);
  const enrichmentRecords = new EnrichmentRecords(projectSourceComponents);

  const componentsToSkip = SourceComponentProcessor.getComponentsToSkip(
    projectSourceComponents,
    metadataEntries,
    project.getPath()
  );
  enrichmentRecords.addRecords(componentsToSkip);

  const componentsEligibleToProcess = filterEligibleComponents(projectSourceComponents, componentsToSkip);

  if (componentsEligibleToProcess.length === 0) {
    vscode.window.showWarningMessage(getMessage('command.metadata.enrich.warn.allSkipped'));
    outputChannel.appendLine(getMessage('command.metadata.enrich.log.allSkipped'));
    outputChannel.show();
    return undefined;
  }

  return { enrichmentRecords, componentsEligibleToProcess };
}

function filterEligibleComponents(
  components: SourceComponent[],
  componentsToSkip: ReturnType<typeof SourceComponentProcessor.getComponentsToSkip>
): SourceComponent[] {
  const skipNames = new Set(Array.from(componentsToSkip, s => s.componentName));
  return components.filter(c => {
    const name = c.fullName ?? c.name;
    return name && !skipNames.has(name);
  });
}
