import * as vscode from "vscode";
import * as path from "path";
import { Contents, Memo } from "./interface";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(CustomTextEditor.register(context));
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

    // webviewとドキュメントの同期処理をする
    // ドキュメントが直接更新された場合、
    // または、カスタムエディタが複数開かれており、どちらか一方で更新された場合など。
    const saveDocumentSubscription = vscode.workspace.onDidSaveTextDocument(
      (e) => {
        if (e.uri.toString() === document.uri.toString()) {
          // ドキュメントとwebviewとの同期処理をする
          this.refreshContents(document);
          webviewPanel.webview.postMessage({
            type: "refresh",
            payload: this.contents,
          });
        }
      }
    );
    webviewPanel.onDidDispose(() => {
      saveDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage(async (e) => {
      switch (e.type) {
        case "detail":
          this.createDetailView(webviewPanel, e.payload);
          break;
        case "add":
          this.createAddView(webviewPanel);
          break;
        case "save":
          const { payload } = e;
          if (!payload.id) {
            const id = await this.add(document, payload);
            payload.id = id;
            webviewPanel.webview.postMessage({
              type: "finishAdd",
              payload,
            });
          } else {
            await this.update(document, payload);
          }
          break;
        case "back":
          this.createListView(webviewPanel);
          break;
        default:
      }
    });

    this.createListView(webviewPanel);
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
    return (await this.save(document, edit)) ? id.toString() : null;
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
    webview: vscode.Webview
  ): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(context.extensionPath, "media", "out", "media", "list.js")
      )
    );

    return this.getTemplate(scriptUri);
  }

  private createListView(webviewPanel: vscode.WebviewPanel) {
    webviewPanel.webview.html = this.getListView(
      this.context,
      webviewPanel.webview
    );
    webviewPanel.webview.postMessage({
      type: "create",
      payload: this.contents,
    });
  }

  private getDetailView(
    context: vscode.ExtensionContext,
    webview: vscode.Webview
  ) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(context.extensionPath, "media", "out", "media", "detail.js")
      )
    );
    return this.getTemplate(scriptUri);
  }

  private createDetailView(
    webviewPanel: vscode.WebviewPanel,
    payload: Contents
  ) {
    const contentFilteredId = this.contents.contents.filter(
      (value) => value.id == payload.id
    );
    if (contentFilteredId.length < 1) return;
    webviewPanel.webview.html = this.getDetailView(
      this.context,
      webviewPanel.webview
    );
    webviewPanel.webview.postMessage({
      type: "create",
      payload: contentFilteredId[0],
    });
  }

  private createAddView(webviewPanel: vscode.WebviewPanel) {
    const memo: Contents = {
      id: "",
      title: "",
      memo: "",
    };
    webviewPanel.webview.html = this.getDetailView(
      this.context,
      webviewPanel.webview
    );
    webviewPanel.webview.postMessage({
      type: "create",
      payload: memo,
    });
  }

  private getTemplate(scriptUri: vscode.Uri): string {
    return `<!DOCTYPE html>
    <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>memo list</title>
      </head>
      <body>
      </body>
      <script type="module" src="${scriptUri}"></script>
    </html>`;
  }
}

export function deactivate() {}
