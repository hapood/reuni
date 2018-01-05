import Store from "./Store";
import NodeItem from "./Node";
import TaskStatus from "../api/TaskStatus";
import PropertyType from "../api/PropertyType";

export type NodeDictItem = {
  path: string[];
  ref: NodeItem;
  nameDict: Record<string, string>;
  name: string;
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
  parent: NodeItem | null | undefined;
  children: Record<string, NodeItem>;
  isDestroyed: boolean;
};

export type Observer = {
  care: Record<string, Record<string, string[]>>;
  cb: (isValid: boolean) => void;
};
