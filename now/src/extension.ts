import * as vscode from "vscode";
import * as moment from "moment";

export function activate(context: vscode.ExtensionContext) {
  // showQuickPickにて表示するフォーマットのリストを生成する
  const formatList = Object.values(moment.HTML5_FMT)
    .sort()
    .reverse()
    .map<vscode.QuickPickItem>((value) => {
      const example = moment("2000-01-23T12:34:56.789").format(value);
      return {
        label: value,
        description: `e.g. ${example}`,
      };
    });

  let disposable = vscode.commands.registerCommand(
    "extension-practice.now",
    async () => {
      // 挿入する日付のフォーマットをユーザに選択してもらう
      const value = await vscode.window.showQuickPick(formatList, {
        placeHolder: "please select format",
      });

      const textEditor = vscode.window.activeTextEditor;
      if (!textEditor || !value) {
        return;
      }

      // 日付を挿入する
      const now = moment();
      const insertValue = now.format(value.label);
      for (const select of textEditor.selections) {
        await textEditor.edit((builder) => {
          const replaceRange = new vscode.Range(select.start, select.end);
          builder.replace(replaceRange, insertValue);
        });
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
