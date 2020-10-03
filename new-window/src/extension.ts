import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension-practice.open-selected-folder",
    async (args) => {
      // menuで選択したフォルダを新しいウインドウで開く
      const folderUrl = vscode.Uri.file(args.fsPath);
      vscode.commands.executeCommand("vscode.openFolder", folderUrl, true);
    }
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}
