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

import { getMessage } from '../../src/utils/localization';

describe('getMessage', () => {
  it('returns the localized string with substituted arguments', () => {
    const result = getMessage('Hello {0}, you have {1} message(s).', 'Alice', '3');
    expect(result).toBe('Hello Alice, you have 3 message(s).');
  });

  it('returns an empty string when the message is empty', () => {
    expect(getMessage('')).toBe('');
  });
});
