import Store from "./Store";
import Node from "./Node";
import TaskStatus from "../api/TaskStatus";
import PropertyType from "../api/PropertyType";
import ObserveType from "../api/ObserveType";
import { ObserverCB } from "../api/types";

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
  nodeId: string;
  storeName: string | null | undefined;
  care: ObserverCareDict;
  cb: ObserverCB;
};

export type KeyCareItem = {
  type: ObserveType;
  keys: string[];
  rename: string | null | undefined;
};

export type StoreCareDict = {
  [storeName: string]: KeyCareItem;
};

export type ObserverCareDict = {
  [nodeId: string]: StoreCareDict;
};

export type StoreValidDict = {
  [nodeId: string]: {
    [storeName: string]: Store;
  };
};

export type NodeNameDict = {
  [nodeName: string]: {
    symbol: symbol;
    ids: string[];
  };
};

export type NodeThreadDict = Record<any, string[]>;

export type DirtyNodes = Record<
  string,
  Record<string, Record<string, boolean>>
>;
