import { Memo, Contents } from "../src/interface";

// @ts-ignore
const vscode = acquireVsCodeApi();

(() => {
  const setSaveEvent = () => {
    document
      .querySelector("button.save-button")
      ?.addEventListener("click", (e) => {
        const form = document.querySelector("form");
        if (!form) return;
        const formData = new FormData(form);
        const payload: { [key: string]: any } = {};
        formData.forEach((value, key) => {
          payload[key] = value;
        });
        vscode.postMessage({
          type: `save`,
          payload,
        });
      });
  };

  const setBackEvent = () => {
    document
      .querySelector("button.back-button")
      ?.addEventListener("click", (e) => {
        vscode.postMessage({
          type: `back`,
          payload: {},
        });
      });
  };

  const createView = (srcContents: Contents | null) => {
    let contents: Contents = { id: "", title: "", memo: "" };
    if (srcContents) {
      contents = { ...srcContents };
    }
    const bodyContents = `
    <form name="form" style="max-width:300px;">
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
    </form>`;
    const body = document.querySelector("body");
    if (!body) return;
    body.innerHTML = "";
    body.insertAdjacentHTML("afterbegin", bodyContents);
    setSaveEvent();
    setBackEvent();
    vscode.setState({ contents });
  };

  const refreshView = ({ contents }: Memo) => {
    const prevContents: Contents = vscode.getState().contents;
    const sameIdContents = contents.find(
      (value) => value.id === prevContents.id
    );
    if (!sameIdContents) return;

    // 表示項目に一つでも異なる値があった場合、ビューを更新する
    const isRefresh = (Object.keys(sameIdContents) as (keyof Contents)[]).some(
      (value) => sameIdContents[value] !== prevContents[value]
    );
    if (isRefresh) {
      createView(sameIdContents);
    }
  };
  window.addEventListener("message", (e) => {
    const message = e.data;
    switch (message.type) {
      case "create":
        createView(message.payload);
        break;
      case "finishAdd":
        // 新規登録後は、formにidをセットする
        const idElement = document.querySelector<HTMLInputElement>(
          "input[name='id']"
        );
        idElement?.setAttribute("value", `${message.payload.id}`);
        break;
      case "refresh":
        refreshView(message.payload);
    }
  });
  const { contents } = vscode.getState();
  if (contents) {
    createView(contents);
  }
})();
