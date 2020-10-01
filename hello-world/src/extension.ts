// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "extension-practice" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension-practice.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user

      // 情報メッセージ
      const message = vscode.window.showInformationMessage(
        "Information Message!",
        { modal: false },
        { title: "Button1", isCloseAffordance: false },
        { title: "Button2", isCloseAffordance: true }
      );

      // ワーニングメッセージ
      // const message = vscode.window.showWarningMessage("Warning Message!", {
      //   modal: true,
      // });

      // エラーメッセージ
      // const message = vscode.window.showErrorMessage("Error Message!", {
      //   modal: true,
      // });

      // ステータスバーメッセージ
      // const message = vscode.window.setStatusBarMessage(
      //   "status bar message",
      //   5000
      // );
      message.then((value) => {
        console.log(value);
      });
    }
  );
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    1
  );
  item.text = `status`;
  item.tooltip = `ツールチップ`;
  item.command = "extension-practice.helloWorld";
  item.show();

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
