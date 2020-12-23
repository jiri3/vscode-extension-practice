import { Memo, Contents } from "../src/interface";

// @ts-ignore
const vscode = acquireVsCodeApi();

(() => {
  const setDetailEvent = () => {
    const aElements = document.querySelectorAll("a");
    if (!aElements) {
      return;
    }
    Array.from(aElements).forEach((a) => {
      a.addEventListener("click", (e) => {
        const payload = { id: a.dataset["id"] };
        vscode.postMessage({
          type: `detail`,
          payload,
        });
      });
    });
  };

  const setAddEvent = () => {
    document
      .querySelector("button.add-button")
      ?.addEventListener("click", (e) => {
        vscode.postMessage({
          type: `add`,
          payload: {},
        });
      });
  };

  const createView = (memo: Memo | null) => {
    if (!memo) return;
    const tbody = memo.contents.reduce((pre, cur) => {
      return `${pre}<tr><td>
        <a href="javascript:voie(0)" data-id="${cur.id}">${cur.title}</a>
      </td><td>${cur.memo}</td></tr>`;
    }, "");
    const table = `<table border="1">
            <thead><tr><th>タイトル</th><th>メモ</th></tr></thead>
            <tbody>${tbody}</tbody>
          </table>`;
    const bodyContents = `<button type="button" class="add-button" name="add" value="add">新規</button>
      ${table}`;
    const body = document.querySelector("body");
    if (!body) return;
    body.innerHTML = "";
    body.insertAdjacentHTML("afterbegin", bodyContents);
    setDetailEvent();
    setAddEvent();
    vscode.setState({ memo });
  };

  function refreshView(contents: Contents) {
    // TODO
    const state = vscode.get;
    const body = document.querySelector("body");
  }

  window.addEventListener("message", (e) => {
    const message = e.data;
    switch (message.type) {
      case "create":
        createView(message.payload);
        break;
      case "refresh":
        refreshView(message.payload);
    }
  });

  const { memo } = vscode.getState();
  if (memo) {
    createView(memo);
  }
})();
