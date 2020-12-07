import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "memo" is now active!');

  context.subscriptions.push(CustomTextEditor.register(context));

  // let disposable = vscode.commands.registerCommand(
  //   "extension-practice.memo",
  //   () => {
  //     const panel = vscode.window.createWebviewPanel(
  //       "memo",
  //       "memo",
  //       vscode.ViewColumn.Two,
  //       {
  //         enableScripts: true,
  //       }
  //     );
  //     panel.webview.html = getView(context, panel.webview);
  //     panel.webview.onDidReceiveMessage((e) => {
  //       switch (e.type) {
  //         case "save":
  //           console.log(e.payload);
  //           break;
  //         default:
  //           break;
  //       }
  //     });
  //   }
  // );

  // context.subscriptions.push(disposable);
}

interface Contents {
  id: string;
  title: string;
  memo: string;
}

interface Memo {
  contents: Contents[];
}
class CustomTextEditor implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new CustomTextEditor(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      CustomTextEditor.viewType,
      provider
    );
    return providerRegistration;
  }

  private static readonly viewType = `extension-practice.memo`;
  private contents: Memo = { contents: [] };

  private fetchContents(document: vscode.TextDocument) {
    const text = document.getText();
    try {
      this.contents = JSON.parse(text);
    } catch (e) {
      vscode.window.showErrorMessage("memoファイルが破損しています。");
    }
  }
  private refreshContents(document: vscode.TextDocument) {
    this.fetchContents(document);
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    this.fetchContents(document);

    webviewPanel.webview.html = getListView(
      this.context,
      webviewPanel.webview,
      this.contents
    );
    webviewPanel.webview.onDidReceiveMessage(async (e) => {
      switch (e.type) {
        case "detail":
          const contentFilteredId = this.contents.contents.filter(
            (value) => value.id == e.payload.id
          );
          if (contentFilteredId.length < 1) return;
          webviewPanel.webview.html = getDetailView(
            this.context,
            webviewPanel.webview,
            contentFilteredId[0]
          );
          break;
        case "add":
          const memo: Contents = {
            id: "",
            title: "",
            memo: "",
          };
          webviewPanel.webview.html = getDetailView(
            this.context,
            webviewPanel.webview,
            memo
          );
          break;
        case "save":
          const { payload } = e;
          if (!payload.id) {
            this.add(document, payload);
          } else {
            await this.update(document, payload);
          }
          break;
        case "back":
          this.refreshContents(document);
          webviewPanel.webview.html = getListView(
            this.context,
            webviewPanel.webview,
            this.contents
          );
          break;
        default:
      }
    });
  }

  private async add(document: vscode.TextDocument, content: Contents) {
    const { title, memo } = content;
    let id = 1;
    const length = this.contents.contents.length;
    if (length) {
      const lastContents = this.contents.contents[length - 1];
      id = Number(lastContents.id) + 1;
    }

    const text = document.getText();
    const replaceRegExp = new RegExp(`\\}\\s*\\]`);
    const firstIndex = text.search(replaceRegExp);
    const position = document.positionAt(firstIndex + 1);
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(position, position),
      `,\r${JSON.stringify({ id: id.toString(), title, memo })}`
    );

    return this.save(document, edit);
  }

  private async update(document: vscode.TextDocument, content: Contents) {
    const { id } = content;
    const text = document.getText();
    const replaceRegExp = new RegExp(`\\{\\s*"id":\\s*"${id}"(?:.|\\s)*?\\}`);
    const firstIndex = text.search(replaceRegExp);
    const match = text.match(replaceRegExp);
    if (!match?.length) return;
    const lastIndex = firstIndex + match[0].length;

    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(
        document.positionAt(firstIndex),
        document.positionAt(lastIndex)
      ),
      JSON.stringify(content)
    );

    return this.save(document, edit);
  }

  private async save(
    document: vscode.TextDocument,
    edit: vscode.WorkspaceEdit
  ) {
    const isApplay = await vscode.workspace.applyEdit(edit);
    if (!isApplay) return false;
    return document.save();
  }
}

function getListView(
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
  memo: Memo | null
): string {
  if (!memo) return "";
  const body = memo.contents.reduce((pre, cur) => {
    return `${pre}<tr><td>
      <a href="javascript:voie(0)" data-id="${cur.id}">${cur.title}</a>
    </td><td>${cur.memo}</td></tr>`;
  }, "");
  const table = `<table border="1">
    <thead><tr><th>タイトル</th><th>メモ</th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;

  const scriptUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, "media", "out", "list.js"))
  );

  return `<!DOCTYPE html>
  <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>memo list</title>
    </head>
    <body>
      <button type="button" class="add-button" name="add" value="add">新規</button>
      ${table}
    </body>
    <script src="${scriptUri}"></script>
  </html>`;
}

function getDetailView(
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
  contents: Contents
) {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.file(
      path.join(context.extensionPath, "media", "out", "detail.js")
    )
  );
  return `<!DOCTYPE html>
  <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Memo Detail</title>
    </head>
    <body style="max-width:300px;">
      <form name="form">
        <input name="id" type="hidden" value="${contents.id}" />
        <div>
          <label>タイトル:</label><input name="title" type="text" value="${contents.title}" required />
        </div>
        <div>
          <label style="vertical-align:top;">メモ:</label>
          <textarea name="memo" rows="4" cols="30">${contents.memo}</textarea>
        </div>
        <button style="float:right; margin-right:50px" type="button" class="save-button" name="save" value="save">保存</button>
        <button style="float:right; margin-right:20px" type="button" class="back-button" name="back" value="back">戻る</button>
      </form>
    </body>
    <script src="${scriptUri}"></script>
  </html>`;
}

export function deactivate() {}
