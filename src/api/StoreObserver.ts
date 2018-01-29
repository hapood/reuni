import ObserveType from "./ObserveType";
import { ThreadStoreCare, NameStoreCare, NodeCareCategory } from "./types";
import { KeyCareItem } from "../core/types";

export type StoreRename = {
  (name: string): void;
};

export type StoreObserveOptions = {
  includes: (keys: string[]) => { rename: StoreRename };
  excludes: (keys: string[]) => { rename: StoreRename };
  rename: StoreRename;
};

export type StoreGetter = (
  storeOptions: Record<string, StoreObserveOptions>
) => void;

function createStoreProxy(): [StoreObserveOptions, KeyCareItem] {
  let target: KeyCareItem = {
      type: ObserveType.ALL,
      keys: [],
      rename: null
    },
    handler = {
      get: function(target: KeyCareItem, name: string) {
        let setRename = (rename: string) => {
          target.rename = rename;
        };
        let setKeys: any = (keys: string[]) => {
          target.keys = keys;
          return { rename: setRename };
        };
        setKeys.rename = setRename;
        switch (name) {
          case "includes":
            target.type = ObserveType.INCLUDE;
            return setKeys;
          case "excludes":
            target.type = ObserveType.EXCLUDE;
            return setKeys;
          case "rename":
            target.type = ObserveType.EXCLUDE;
            return setRename;
        }
        return null;
      }
    };
  return [new Proxy(target, handler) as any, target];
}

export default class StoreObserver {
  private _careCate: NodeCareCategory;

  constructor(storeGetter?: StoreGetter) {
    let target: NodeCareCategory = { names: [], threads: [] },
      handler = {
        get: function(target: NodeCareCategory, name: string) {
          let [proxy, keyCareItem] = createStoreProxy();
          target.threads.push({
            name,
            parent: 0,
            store: keyCareItem,
            rename: keyCareItem.rename
          });
          return proxy;
        }
      };
    if (storeGetter != null) {
      storeGetter(new Proxy(target, handler) as any);
    }
    this._careCate = target;
  }

  getCareCate() {
    return this._careCate;
  }

  byName(nodeName: string, storeGetter: StoreGetter) {
    let handler = {
      get: function(target: NodeCareCategory, name: string) {
        let [proxy, keyCareItem] = createStoreProxy();
        target.names.push({
          name,
          nodeName,
          store: keyCareItem,
          rename: keyCareItem.rename
        });
        return proxy;
      }
    };
    if (storeGetter != null) {
      storeGetter(new Proxy(this._careCate, handler) as any);
    }
    return this;
  }

  byThread(storeGetter: StoreGetter, parent: number = 1) {
    let handler = {
      get: function(target: NodeCareCategory, name: string) {
        let [proxy, keyCareItem] = createStoreProxy();
        target.threads.push({
          name,
          parent,
          store: keyCareItem,
          rename: keyCareItem.rename
        });
        return proxy;
      }
    };
    if (storeGetter != null) {
      {
        storeGetter(new Proxy(this._careCate, handler) as any);
      }
    }
    return this;
  }
}

export function storeObserver(
  storeGetter: (storeOptions: Record<string, StoreObserveOptions>) => void
): StoreObserver;
export function storeObserver(): StoreObserver;
export function storeObserver(storeGetter?: any) {
  return new StoreObserver(storeGetter);
}
