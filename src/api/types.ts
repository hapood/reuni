import ObserveType from "./ObserveType";
import { KeyCareItem } from "../core/types";

export type ObserverCareThread = {
  parent: number;
  store: KeyCareItem;
};

export type ObserverCareName = {
  name: string;
  store: KeyCareItem;
};

export type NodeCareCategory = {
  names: ObserverCareName[];
  threads: ObserverCareThread[];
};
