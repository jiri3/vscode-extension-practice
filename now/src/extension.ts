import * as vscode from "vscode";
import * as moment from "moment";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "extension-practice" is now active!'
  );

  let disposable = vscode.commands.registerTextEditorCommand(
    "extension-practice.now",
    (texitEditor, edit) => {
      texitEditor.selections.forEach((select) => {
        const replaceRange = new vscode.Range(select.start, select.end);
        const now = moment();
        edit.replace(
          replaceRange,
          now.format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS)
        );
      });
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
