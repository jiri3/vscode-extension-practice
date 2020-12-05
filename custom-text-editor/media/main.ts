// declare var acquireVsCodeApi: any;

(() => {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  const button = document.querySelector(".save-button");
  const form = document.querySelector("form");
  button?.addEventListener("click", () => {
    console.log(form?.querySelectorAll("input, textarea"));
    if (!form) return;
    const aaa = Array.from<HTMLInputElement>(
      form?.querySelectorAll("input, textarea")
    ).reduce<{
      [key: string]: any;
    }>((pre, cur) => {
      console.log(cur.name, cur.value);
      pre[cur.name] = cur.value;
      return pre;
    }, {});
    console.log(aaa);
    const formData = new FormData(<HTMLFormElement>form);
    const payload: { [key: string]: any } = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });

    vscode.postMessage({
      type: `save`,
      payload: payload,
    });
  });
})();
