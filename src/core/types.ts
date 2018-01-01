import Node from "./Node";

export type SceneDictItem = {
  path: string[];
  ref: Node;
  nameDict: Record<string, string>;
  name: string;
};

export type SceneDict = Record<string, SceneDictItem>;

export type TransItem = {
  id: string;
  isDone: boolean;
  isCanceled: boolean;
};

export type Observer = {
  care: Record<string, Record<string, string[]>>;
  cb: (isValid: boolean) => void;
};
