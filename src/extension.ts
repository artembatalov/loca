import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('loca.helloWorld', () => {
    vscode.window.showInformationMessage('Hello from LOCA!');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}