'use strict'

import * as path from 'path'
import { ExtensionContext, workspace } from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node'

let client: LanguageClient

export async function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration('bashIde')

  const env: any = {
    ...process.env,
    SHELLCHECK_PATH: config.get('shellcheckPath', ''),
    SHELLCHECK_ARGUMENTS: config.get('shellcheckArguments', ''),
    EXPLAINSHELL_ENDPOINT: config.get('explainshellEndpoint', ''),
    GLOB_PATTERN: config.get('globPattern', ''),
    HIGHLIGHT_PARSING_ERRORS: config.get('highlightParsingErrors', false),
  }

  const serverExecutable = {
    module: context.asAbsolutePath(path.join('out', 'server.js')),
    transport: TransportKind.ipc,
    options: {
      env,
    },
  }

  const debugServerExecutable = {
    ...serverExecutable,
    options: {
      ...serverExecutable.options,
      execArgv: ['--nolazy', '--inspect=6009'],
    },
  }

  const serverOptions: ServerOptions = {
    run: serverExecutable,
    debug: debugServerExecutable,
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      {
        scheme: 'file',
        language: 'shellscript',
      },
    ],
    synchronize: {
      configurationSection: 'bashIde',
      // Notify the server about file changes to '.clientrc files contain in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
    },
  }

  const client = new LanguageClient('Bash IDE', 'Bash IDE', serverOptions, clientOptions)
  client.registerProposedFeatures()
  try {
    await client.start()
  } catch (error) {
    client.error(`Start failed`, error, 'force')
  }
}

export function deactivate() {
  return client.stop()
}
