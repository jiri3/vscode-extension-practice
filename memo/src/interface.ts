export interface Contents {
  id: string;
  title: string;
  memo: string;
}

export interface Memo {
  contents: Contents[];
}
