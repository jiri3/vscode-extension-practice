(() => {
  // @ts-ignore
  const vscode = acquireVsCodeApi();
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

  document
    .querySelector("button.back-button")
    ?.addEventListener("click", (e) => {
      vscode.postMessage({
        type: `back`,
        payload: {},
      });
    });
})();
