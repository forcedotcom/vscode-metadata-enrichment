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

const typeDirectoryNames = new Set(Object.values(new RegistryAccess().getRegistry().types).map(t => t.directoryName));

/**
 * Returns true if the given path is eligible for enrichment.
 * An enrichment-eligible path must have the following:
 *   1. Is within, but not at the root of, a package directory (e.g. force-app/main/default/)
 *   2. Is at or within a metadata type directory (e.g. lwc/, classes/, objects/)
 */
export function isEligibleEnrichmentPath(fsPath: string, project: SfProject): boolean {
  const packageDir = project.getPackageFromPath(fsPath);
  if (!packageDir) {
    return false;
  }
  return isWithinMetadataTypeDirectory(path.resolve(fsPath), path.resolve(packageDir.fullPath));
}

/**
 * Returns true if the provided path is at or within a metadata type directory.
 * (e.g. lwc/, classes/, objects/)
 *
 * From the provided path, walks up level-by-level checking if the current level
 * is a metadata type directory, comparing to the SDR registry.
 * If it reaches the package root before finding a matching metadata type directory, then returns false.
 */
function isWithinMetadataTypeDirectory(fsPath: string, packageRootPath: string): boolean {
  let current = fsPath;
  while (current !== packageRootPath) {
    if (typeDirectoryNames.has(path.basename(current))) {
      return true;
    }
    current = path.dirname(current);
  }
  return false;
}
