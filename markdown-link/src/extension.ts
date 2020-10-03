import { win32 } from "path";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension-practice.markdown-link",
    async () => {
      // 検索に利用するglobパターンをユーザに入力してもらう
      const globPattern = await vscode.window.showInputBox({
        prompt: "please enter glob pattern",
      });
      if (globPattern === undefined) {
        return;
      }

      // ワークスペースからglobパターンに一致するファイルを検索する
      const fileUris = await vscode.workspace.findFiles(globPattern);
      if (fileUris.length === 0) {
        vscode.window.showInformationMessage("Not found", {
          modal: true,
        });
        return;
      }
      // 見つかったファイルについて、ワークスペースルートからの相対パスに変換する
      const items = fileUris.map((value) =>
        vscode.workspace.asRelativePath(value)
      );

      // ユーザーがQuickPickで選択したアイテムをmarkdownのリンク形式にして、エディタに挿入する
      const selectedItem = await vscode.window.showQuickPick(items);
      if (selectedItem === undefined) {
        return;
      }

      const editor = vscode.window.activeTextEditor;
      editor?.edit((builder) => {
        // 画像ファイルは先頭にエクステンションマークを付ける
        const imgCheck = new RegExp(/\.(?:png|jpg|gif)$/);
        const img = imgCheck.test(selectedItem) ? "!" : "";
        const insertValue = `${img}[](${selectedItem})`;

        builder.insert(editor.selection.start, insertValue);
      });
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
