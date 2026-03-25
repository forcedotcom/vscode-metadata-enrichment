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

import { isWithinMetadataTypeDirectory, isEligibleEnrichmentPath } from '../../src/utils/pathValidator';

jest.mock('@salesforce/source-deploy-retrieve', () => ({
  RegistryAccess: jest.fn().mockImplementation(() => ({
    getRegistry: () => ({
      types: {
        lightningcomponentbundle: { directoryName: 'lwc' },
        apexclass: { directoryName: 'classes' }
      }
    })
  }))
}));

const PACKAGE_ROOT = '/workspace/force-app';

describe('isWithinMetadataTypeDirectory', () => {
  it('returns true when fsPath is a recognized type directory', () => {
    const result = isWithinMetadataTypeDirectory(`${PACKAGE_ROOT}/main/default/lwc`, PACKAGE_ROOT);
    expect(result).toBe(true);
  });

  it('returns false when fsPath is an intermediate non-type directory above any type folder', () => {
    const result = isWithinMetadataTypeDirectory(`${PACKAGE_ROOT}/main/default`, PACKAGE_ROOT);
    expect(result).toBe(false);
  });
});

describe('isEligibleEnrichmentPath', () => {
  it('returns true when fsPath is inside a package directory at the type folder level', () => {
    const mockProject = {
      getPackageFromPath: () => ({ fullPath: PACKAGE_ROOT })
    } as any;

    const result = isEligibleEnrichmentPath(`${PACKAGE_ROOT}/main/default/classes`, mockProject);
    expect(result).toBe(true);
  });

  it('returns false when fsPath is not within any package directory', () => {
    const mockProject = {
      getPackageFromPath: () => undefined
    } as any;

    const result = isEligibleEnrichmentPath('/some/unrelated/path', mockProject);
    expect(result).toBe(false);
  });
});
