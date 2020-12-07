// @ts-ignore
const vscode = acquireVsCodeApi();

(() => {
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

  document
    .querySelector("button.add-button")
    ?.addEventListener("click", (e) => {
      vscode.postMessage({
        type: `add`,
        payload: {},
      });
    });
})();
