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

import * as path from 'path';
import { SfProject } from '@salesforce/core';
import { RegistryAccess } from '@salesforce/source-deploy-retrieve';

/**
 * Returns true if fsPath is at or below a recognized metadata type directory
 * (e.g. lwc/, classes/, objects/) within the package, by walking up the path
 * from fsPath to the package root and checking each segment against the SDR registry.
 */
export function isAtOrBelowTypeDirectory(fsPath: string, packageRootPath: string): boolean {
  const registry = new RegistryAccess();
  const typeDirectoryNames = new Set(Object.values(registry.getRegistry().types).map(t => t.directoryName));
  let current = fsPath;
  while (current !== packageRootPath && current.length > packageRootPath.length) {
    if (typeDirectoryNames.has(path.basename(current))) {
      return true;
    }
    current = path.dirname(current);
  }
  return false;
}

/**
 * Returns true if fsPath is at a metadata type folder or deeper within a package directory
 * (e.g. force-app/main/default/lwc/ or any file/folder inside it), and false for paths at
 * or above the package directory level or in intermediate non-type directories like
 * force-app/main/default/.
 */
export function isInsidePackageDirectory(fsPath: string, project: SfProject): boolean {
  const packageDir = project.getPackageFromPath(fsPath);
  if (!packageDir) {
    return false;
  }
  const normalizedFsPath = path.resolve(fsPath);
  const normalizedPackageRoot = path.resolve(packageDir.fullPath);
  if (normalizedFsPath === normalizedPackageRoot) {
    return false;
  }
  return isAtOrBelowTypeDirectory(normalizedFsPath, normalizedPackageRoot);
}
