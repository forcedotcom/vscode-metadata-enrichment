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

import * as assert from 'assert';
import * as vscode from 'vscode';

const EXTENSION_ID = 'salesforce.salesforce-metadata-enrichment';

describe('Extension', () => {
  before(async () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `Extension ${EXTENSION_ID} should be registered`);
    await ext.activate();
  });

  it('is active after activation', () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.strictEqual(ext?.isActive, true, 'Extension should be active');
  });

  it('registers sf.metadata.enrich command', async () => {
    const cmds = await vscode.commands.getCommands(true);
    assert.ok(cmds.includes('sf.metadata.enrich'), 'sf.metadata.enrich should be registered');
  });

  it('registers sf.metadata.enrich.context command', async () => {
    const cmds = await vscode.commands.getCommands(true);
    assert.ok(cmds.includes('sf.metadata.enrich.context'), 'sf.metadata.enrich.context should be registered');
  });
});
