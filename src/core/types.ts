import Store from "./Store";
import Node from "./Node";
import TaskStatus from "../api/TaskStatus";
import PropertyType from "../api/PropertyType";
import ObserveType from "../api/ObserveType";

export type NodeDictItem = {
  path: string[];
  ref: Node;
};

export type NodeDict = Record<string, NodeDictItem>;

export type TaskDictItem = {
  type: PropertyType;
  task: () => void;
};

export type TaskDict = Record<string, TaskDictItem>;

export type TaskItem = {
  id: string;
  isDone: boolean;
  isCanceled: boolean;
  observers: ((status: TaskStatus) => void)[];
};

export type NodeItem = {
  id: string;
  name: string;
  stores: Record<string, Store>;
  parent: Node | null | undefined;
  children: Record<string, Node>;
  isDestroyed: boolean;
};

export type Observer = {
  care: ObserverCareDict;
  cb: (isValid: boolean) => void;
};

export type KeyCareItem = {
  type: ObserveType;
  keys: string[];
};

export type StoreCareDict = {
  [storeName: string]: KeyCareItem;
};

export type ObserverCareDict = {
  [nodeId: string]: StoreCareDict;
};

export type StoreValidDict = {
  [nodeId: string]: {
    [storeName: string]: boolean;
  };
};

export type NodeNameDict = {
  [nodeName: string]: {
    symbol: symbol;
    ids: string[];
  };
};

export type NodeThreadDict = Record<any, string[]>;