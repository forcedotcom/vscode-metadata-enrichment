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

import { isEligibleEnrichmentPath } from '../../src/utils/pathValidator';

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

const mockProject = (packageRoot: string | undefined) =>
  ({ getPackageFromPath: () => (packageRoot ? { fullPath: packageRoot } : undefined) }) as any;

describe('isEligibleEnrichmentPath', () => {
  it('returns true when fsPath is inside a package directory at the type folder level', () => {
    const result = isEligibleEnrichmentPath(`${PACKAGE_ROOT}/main/default/classes`, mockProject(PACKAGE_ROOT));
    expect(result).toBe(true);
  });

  it('returns false when fsPath is not within any package directory', () => {
    const result = isEligibleEnrichmentPath('/some/unrelated/path', mockProject(undefined));
    expect(result).toBe(false);
  });

  it('returns false when fsPath is above the package root', () => {
    const result = isEligibleEnrichmentPath('/workspace', mockProject(PACKAGE_ROOT));
    expect(result).toBe(false);
  });

  it('returns true when fsPath is at the type directory level', () => {
    const result = isEligibleEnrichmentPath(`${PACKAGE_ROOT}/main/default/lwc`, mockProject(PACKAGE_ROOT));
    expect(result).toBe(true);
  });

  it('returns true when fsPath is at the component folder level', () => {
    const result = isEligibleEnrichmentPath(`${PACKAGE_ROOT}/main/default/lwc/myComp`, mockProject(PACKAGE_ROOT));
    expect(result).toBe(true);
  });

  it('returns true when fsPath is at a specific component file level', () => {
    const result = isEligibleEnrichmentPath(
      `${PACKAGE_ROOT}/main/default/lwc/myComp/myComp.js`,
      mockProject(PACKAGE_ROOT)
    );
    expect(result).toBe(true);
  });

  it('returns false when fsPath is within the package but not under a valid type folder', () => {
    const result = isEligibleEnrichmentPath(`${PACKAGE_ROOT}/main/default/notAType`, mockProject(PACKAGE_ROOT));
    expect(result).toBe(false);
  });

  it('returns false when fsPath is a file within the package but not under a valid type folder', () => {
    const result = isEligibleEnrichmentPath(
      `${PACKAGE_ROOT}/main/default/notAType/someFile.js`,
      mockProject(PACKAGE_ROOT)
    );
    expect(result).toBe(false);
  });
});
