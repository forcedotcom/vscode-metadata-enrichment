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
import { AuthInfo, type Connection, Org } from '@salesforce/core';
import { getMessage } from '../utils/localization';

export type OrgConnection = {
  username: string;
  connection: Connection;
};

/**
 * FLOW - Connect to Org
 *
 * Lists all the locally authenticated orgs in the user's DX project.
 * Prompts the user to select one and returns the corresponding org connection
 * Displays pop-up message to user if no orgs are found.
 */
export async function pickOrgAndConnect(): Promise<OrgConnection | undefined> {
  let auths: Awaited<ReturnType<typeof AuthInfo.listAllAuthorizations>>;
  try {
    auths = await AuthInfo.listAllAuthorizations();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(getMessage('command.metadata.enrich.error.listOrgsFailed', message));
    return undefined;
  }

  if (auths.length === 0) {
    vscode.window.showErrorMessage(getMessage('command.metadata.enrich.error.noOrgs'));
    return undefined;
  }

  const items = auths.map(auth => ({
    label: auth.username,
    description: auth.aliases?.join(', ')
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: getMessage('command.metadata.enrich.pick.org.placeholder'),
    ignoreFocusOut: true
  });

  if (!selected) {
    return undefined;
  }

  try {
    const org = await Org.create({ aliasOrUsername: selected.label });
    const connection = org.getConnection();
    return { username: selected.label, connection };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(getMessage('command.metadata.enrich.error.connectOrgFailed', message));
    return undefined;
  }
}
