import ObserveType from "./ObserveType";
import { KeyCareItem } from "../core/types";

export type ThreadStoreCare = {
  parent: number;
  store: KeyCareItem;
  name: string;
  rename: string | null | undefined;
};

export type NameStoreCare = {
  nodeName: string;
  name: string;
  rename: string | null | undefined;
  store: KeyCareItem;
};

export type NodeCareCategory = {
  names: NameStoreCare[];
  threads: ThreadStoreCare[];
};

export type InjectSource = {
  [storeName: string]: {};
};

export type ObserverCB = {
  (isValid: boolean, entityDict?: Record<string, any>): void;
};
