import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "custom-text-editor" is now active!'
  );

  let disposable = vscode.commands.registerCommand(
    "extension-practice.custom-text-editor",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "custom-text-editor",
        "custom-text Editor",
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
        }
      );
      panel.webview.html = getView(context, panel.webview);
      panel.webview.onDidReceiveMessage((e) => {
        switch (e.type) {
          case "save":
            console.log(e.payload);
            break;
          default:
            break;
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

class CustomTextEditor implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    throw new Error("Method not implemented.");
  }
}

function getView(context: vscode.ExtensionContext, webview: vscode.Webview) {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, "media", "out", "main.js"))
  );
  return `<!DOCTYPE html>
  <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>form</title>
    </head>
    <body style="max-width:300px;">
      <form name="form">
        <div>
          <label>名前:</label><input name="name" type="text" />
        </div>
        <div>
          <label>性別:</label>
          <label for="m">男</label><input name="gender" id="m" type="radio" value="male" />
          <label for="f">女</label><input name="gender" id="f" type="radio" value="female" />
        </div>
        <div>
          <label style="vertical-align:top;">備考:</label>
          <textarea name="memo" rows="4" cols="30"></textarea>
        </div>
        <button style="float:right; margin-right:50px" type="button" class="save-button" name="save" value="save">保存</button>
      </form>
    </body>
    <script src="${scriptUri}"></script>
  </html>`;
}

export function deactivate() {}
