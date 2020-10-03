import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension-practice.git-config",
    async () => {
      const { userName, userEmail } = vscode.workspace.getConfiguration(
        "git-config"
      );
      if (!(userName && userEmail)) {
        // コンフィグでユーザー名とメールアドレスが設定されていない場合は、
        // 設定を促し、処理を終える
        const message = vscode.window.showWarningMessage(
          "Please set configration. Click Open User Settings: Extensions > Git config",
          "Open User Settings"
        );
        message.then((value) => {
          if (!value) return;
          vscode.commands.executeCommand("workbench.action.openGlobalSettings");
        });
        return;
      }

      // git configを実行する
      let terminal = vscode.window.activeTerminal;
      if (terminal === undefined) {
        terminal = vscode.window.createTerminal();
      }
      terminal.show();
      terminal.sendText(`git config --local user.name "${userName}"`);
      terminal.sendText(`git config --local user.email "${userEmail}"`);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
