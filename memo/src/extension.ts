import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(CustomTextEditor.register(context));
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
  private static readonly viewType = `extension-practice.memo`;
  private contents: Memo = { contents: [] };

  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new CustomTextEditor(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      CustomTextEditor.viewType,
      provider
    );
    return providerRegistration;
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

    webviewPanel.webview.html = this.getListView(
      this.context,
      webviewPanel.webview,
      this.contents
    );

    // webviewとドキュメントの同期処理をする
    // ドキュメントが直接更新された場合、
    // または、カスタムエディタが複数開かれており、どちらか一方で更新された場合など。
    // const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
    //   (e) => {
    //     if (e.document.uri.toString() === document.uri.toString()) {
    //       // ドキュメントとwebviewとの同期処理をする
    //     }
    //   }
    // );
    // webviewPanel.onDidDispose(() => {
    //   changeDocumentSubscription.dispose();
    // });

    webviewPanel.webview.onDidReceiveMessage(async (e) => {
      switch (e.type) {
        case "detail":
          const contentFilteredId = this.contents.contents.filter(
            (value) => value.id == e.payload.id
          );
          if (contentFilteredId.length < 1) return;
          webviewPanel.webview.html = this.getDetailView(
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
          webviewPanel.webview.html = this.getDetailView(
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
          webviewPanel.webview.html = this.getListView(
            this.context,
            webviewPanel.webview,
            this.contents
          );
          break;
        default:
      }
    });
  }

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

  /**
   * ドキュメントに新規データを追加する.
   * JSON形式のドキュメントのcontentsプロパティの末尾に
   * 新規データを追加する.
   *
   * {
   *    "contents":[
   *      {"id":"1","title":"AA","memo":"ABCDEFG"},
   *      {"id":"2","title":"B","memo":"12345"}
   *      ///  末尾に新規データ(content)の内容を追加する ///
   *    ]
   *  }
   *
   * @param document
   * @param content 新規登録データ
   */
  private async add(document: vscode.TextDocument, content: Contents) {
    const { title, memo } = content;
    let id = 1;
    const length = this.contents.contents.length;
    if (length) {
      const lastContents = this.contents.contents[length - 1];
      id = Number(lastContents.id) + 1;
    }

    const text = document.getText();
    // ドキュメント中から末尾のcontentsデータを探す正規表現
    const replaceRegExp = new RegExp(`\\}\\s*\\]`);
    const firstIndex = text.search(replaceRegExp);
    const position = document.positionAt(firstIndex + 1);
    const edit = new vscode.WorkspaceEdit();

    // ドキュメントにcontentのデータを追加する
    // replaceメソッドは、ドキュメントの保存はされないので注意のこと
    edit.replace(
      document.uri,
      new vscode.Range(position, position),
      `,\r${JSON.stringify({ id: id.toString(), title, memo })}`
    );

    // ドキュメントを保存する
    return this.save(document, edit);
  }

  /**
   * ドキュメントを更新する.
   * content.idと一致するドキュメント内のJSONデータを書換える.
   *
   * ex) cotent.id = "2"の場合
   * {
   *    "contents":[
   *      {"id":"1","title":"AA","memo":"ABCDEFG"},
   *      {"id":"2","title":"B","memo":"12345"},
   *      // ↑ 上記データをcontentの内容に書換える
   *      ...
   *    ]
   * }
   *
   * @param document
   * @param content 更新データ
   */
  private async update(document: vscode.TextDocument, content: Contents) {
    const { id } = content;
    const text = document.getText();
    // ドキュメント中から書換え対象のデータを探す正規表現
    const replaceRegExp = new RegExp(`\\{\\s*"id":\\s*"${id}"(?:.|\\s)*?\\}`);
    const firstIndex = text.search(replaceRegExp);
    const match = text.match(replaceRegExp);

    if (!match?.length) return;
    const lastIndex = firstIndex + match[0].length;

    // ドキュメントにcontentのデータを反映する
    // replaceメソッドは、ドキュメントの保存はされないので注意のこと
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(
        document.positionAt(firstIndex),
        document.positionAt(lastIndex)
      ),
      JSON.stringify(content)
    );

    // ドキュメントを保存する
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

  private getListView(
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
      vscode.Uri.file(
        path.join(context.extensionPath, "media", "out", "list.js")
      )
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

  private getDetailView(
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
}

export function deactivate() {}
