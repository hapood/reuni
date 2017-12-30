import Node from "./Node";

export type SceneDictItem = {
  path: string[];
  ref: Node;
};

export type SceneDict = Record<string, SceneDictItem>;

export type RawScene<S, A> = {
  name: string;
  state: S;
  actions: A;
};

export type RawNode = {
  id?: string;
  name: string;
  scenes: RawScene<any, any>[];
};

export type SceneObserver = (keyList: string[]) => void;
