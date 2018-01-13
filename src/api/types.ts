import ObserveType from "./ObserveType";
import { KeyCareItem } from "../core/types";

export type ThreadStoreCare = {
  parent: number;
  store: KeyCareItem;
  name: string;
  rename: string;
};

export type NameStoreCare = {
  nodeName: string;
  name: string;
  rename: string;
  store: KeyCareItem;
};

export type NodeCareCategory = {
  names: NameStoreCare[];
  threads: ThreadStoreCare[];
};
