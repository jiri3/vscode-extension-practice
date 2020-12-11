import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension-practice.vue-try",
    () => {
      const panel = vscode.window.createWebviewPanel(
        `vue-practice`,
        `Vue Practice`,
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
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
  return `<!DOCTYPE html>
          <html lang="ja">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Hello</title>
          </head>
          <body>
              Hello World!!
          </body>
          </html>`;
}

export function deactivate() {}
