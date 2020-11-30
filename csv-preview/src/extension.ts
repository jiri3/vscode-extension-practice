import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension-practice.csv-preview",
    () => {
      // ドキュメントのCSV形式をHTMLのテーブルに変換する
      const activeDocument = vscode.window.activeTextEditor?.document;
      if (!activeDocument) return;
      const table = convertCsvToHtmlTable(activeDocument);

      // webviewを生成する
      const panel = vscode.window.createWebviewPanel(
        "csvPreview",
        "CSV Preview",
        vscode.ViewColumn.Two
      );

      // cssのパスを生成する。
      // 拡張機能からローカルリソースのアクセスは直接できないため、一手間かかる。
      // 下記参照のこと。
      // https://code.visualstudio.com/api/extension-guides/webview#loading-local-content
      const onDiskPath = vscode.Uri.file(
        path.join(context.extensionPath, "media", "csv-preview.css")
      );
      const cssUri = panel.webview.asWebviewUri(onDiskPath);

      panel.webview.html = getWebviewContent(cssUri, table);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

function convertCsvToHtmlTable(document: vscode.TextDocument): string {
  // ドキュメントのテキストを1行ずつ読み取り、コンマ区切りで配列に変換する
  let content = [];
  for (let i = 0; i < document.lineCount; i++) {
    const commaSplitText = document
      .lineAt(i)
      .text.split(",")
      .map((cell) => cell.trim());
    content.push(commaSplitText);
  }

  // HTML形式に変換する
  const [header, ...body] = content;
  // テキストの1行目はヘッダーにする
  const thead = `<thead><tr>${header.reduce(
    (pre, cur) => `${pre}<th class="header">${cur}</th>`,
    ""
  )}</tr></thead>`;
  // 2行目以降はボディー（表の本体）にする
  const tbody = `<tbody>${body.reduce(
    (pre, cur) =>
      `${pre}<tr>${cur.reduce((pre, cur) => `${pre}<td>${cur}</td>`, "")}</tr>`,
    ""
  )}</tbody>`;

  return `<table border="1">${thead}${tbody}</table>`;
}

function getWebviewContent(cssUri: vscode.Uri, contents: string): string {
  return `<!DOCTYPE html>
          <html lang="ja">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link rel="stylesheet" type="text/css" href="${cssUri}">
              <title>CSV Preview</title>
          </head>
          <body>
              ${contents}
          </body>
          </html>`;
}
