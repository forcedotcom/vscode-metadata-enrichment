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

import { activate, deactivate } from '../src/extension';
import { disposeOutputChannel } from '../src/utils/outputChannel';

jest.mock('../src/commands/metadataEnrich', () => ({
  registerMetadataEnrichCommand: jest.fn().mockReturnValue({ dispose: jest.fn() })
}));

jest.mock('../src/commands/metadataEnrichContext', () => ({
  registerMetadataEnrichContextCommand: jest.fn().mockReturnValue({ dispose: jest.fn() })
}));

jest.mock('../src/utils/outputChannel', () => ({
  disposeOutputChannel: jest.fn()
}));

import { registerMetadataEnrichCommand } from '../src/commands/metadataEnrich';
import { registerMetadataEnrichContextCommand } from '../src/commands/metadataEnrichContext';

describe('extension', () => {
  describe('activate', () => {
    it('registers both commands into the extension context subscriptions', () => {
      const mockContext = { subscriptions: { push: jest.fn() } } as any;

      activate(mockContext);

      expect(registerMetadataEnrichCommand).toHaveBeenCalled();
      expect(registerMetadataEnrichContextCommand).toHaveBeenCalled();
      expect(mockContext.subscriptions.push).toHaveBeenCalledTimes(2);
    });
  });

  describe('deactivate', () => {
    it('disposes the output channel', () => {
      deactivate();
      expect(disposeOutputChannel).toHaveBeenCalled();
    });
  });
});
