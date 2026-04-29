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

import { getMessage } from '../../../src/utils/localization';

describe('getMessage', () => {
  it('returns the localized string for a valid NLS key with substituted arguments', () => {
    const result = getMessage('command.metadata.enrich.log.starting', 'myComp');
    expect(result).toBe('[Metadata Enrichment] Starting enrichment for: myComp');
  });

  it('returns an empty string when the message is empty', () => {
    expect(getMessage('')).toBe('');
  });

  it('returns the key when vscode.l10n.t throws', () => {
    const vscode = require('vscode');
    (vscode.l10n.t as jest.Mock).mockImplementationOnce(() => {
      throw new Error('l10n unavailable');
    });
    expect(getMessage('command.metadata.enrich.info.cancelled')).toBe('command.metadata.enrich.info.cancelled');
  });
});
