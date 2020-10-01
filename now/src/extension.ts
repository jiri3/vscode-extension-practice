import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "extension-practice" is now active!'
  );

  let disposable = vscode.commands.registerTextEditorCommand(
    "extension-practice.now",
    (texitEditor, edit) => {
      texitEditor.selections.forEach((select) => {
        const replaceRange = new vscode.Range(select.start, select.end);
        edit.replace(replaceRange, new Date().toLocaleString());
      });
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
