import Scene from "./Scene";
import Node from "./Node";
import TransactionStatus from "../api/TransactionStatus";
import PropertyType from "../api/PropertyType";

export type SceneDictItem = {
  path: string[];
  ref: Node;
  nameDict: Record<string, string>;
  name: string;
};

export type SceneDict = Record<string, SceneDictItem>;

export type ActionDictItem = {
  type: PropertyType;
  action: () => void;
};

export type ActionDict = Record<string, ActionDictItem>;

export type TransItem = {
  id: string;
  isDone: boolean;
  isCanceled: boolean;
  observers: ((status: TransactionStatus) => void)[];
};

export type NodeItem = {
  id: string;
  name: string;
  scenes: Record<string, Scene>;
  parent: NodeItem | null | undefined;
  children: Record<string, NodeItem>;
  isDestroyed: boolean;
};

export type Observer = {
  care: Record<string, Record<string, string[]>>;
  cb: (isValid: boolean) => void;
};