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
import { getOutputChannel, disposeOutputChannel } from '../../src/utils/outputChannel';

const mockChannel = { appendLine: jest.fn(), show: jest.fn(), dispose: jest.fn() };

describe('outputChannel', () => {
  beforeEach(() => {
    (vscode.window.createOutputChannel as jest.Mock).mockReturnValue(mockChannel);
  });

  afterEach(() => {
    disposeOutputChannel();
  });

  describe('getOutputChannel', () => {
    it('creates and returns an output channel with the correct name', () => {
      const channel = getOutputChannel();
      expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('Salesforce Metadata Enrichment');
      expect(channel).toBe(mockChannel);
    });

    it('returns the same channel on subsequent calls without creating a new one', () => {
      getOutputChannel();
      getOutputChannel();
      expect(vscode.window.createOutputChannel).toHaveBeenCalledTimes(1);
    });
  });

  describe('disposeOutputChannel', () => {
    it('disposes the channel', () => {
      getOutputChannel();
      disposeOutputChannel();
      expect(mockChannel.dispose).toHaveBeenCalled();
    });
  });
});
