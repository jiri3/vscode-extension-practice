import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension-practice.vue-try",
    () => {
      const panel = vscode.window.createWebviewPanel(
        `vue-practice`,
        `Vue Practice`,
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          // メモリ消費が大きいとのこと
          // https://code.visualstudio.com/api/extension-guides/webview#retaincontextwhenhidden
          retainContextWhenHidden: true,
        }
      );
      panel.webview.html = getWebviewContent(context, panel.webview);
    }
  );

  context.subscriptions.push(disposable);
}

function getWebviewContent(
  context: vscode.ExtensionContext,
  webview: vscode.Webview
): string {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.file(
      path.join(context.extensionPath, "media", "dist", "main.js")
    )
  );
  return `<!DOCTYPE html>
          <html lang="ja">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Hello</title>
          </head>
          <body>
              <div id="entry"></div>
              <script src=${scriptUri}></script>
          </body>
          </html>`;
}

export function deactivate() {}
