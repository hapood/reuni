import ObserveType from "./ObserveType";

export type KeyCare = {
  observeType: ObserveType;
  keys: string[];
};

export type StoreCare = {
  [storeName: string]: KeyCare;
};

export type ObserverCare = {
  [nodeId: string]: StoreCare;
};
