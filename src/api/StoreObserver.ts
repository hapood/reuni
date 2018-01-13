import ObserveType from "./ObserveType";
import {
  ObserverCareThread,
  ObserverCareName,
  NodeCareCategory
} from "./types";
import { KeyCareItem } from "../core/types";

export type StoreObserveOptions = {
  includes: (keys: string[]) => void;
  excludes: (keys: string[]) => void;
};

export type StoreGetter = (
  storeOptions: Record<string, StoreObserveOptions>
) => void;

function createStoreProxy() {
  let target: KeyCareItem = { type: ObserveType.ALL, keys: [] },
    handler = {
      get: function(target: KeyCareItem, name: string) {
        let setKeys = (keys: string[]) => {
          target.keys = keys;
        };
        switch (name) {
          case "includes":
            target.type = ObserveType.INCLUDE;
            return setKeys;
          case "excludes":
            target.type = ObserveType.EXCLUDE;
            return setKeys;
        }
        return null;
      }
    };
  return [new Proxy(target, handler), target];
}

export class StoreObserver {
  private _careCate: NodeCareCategory;

  constructor(storeGetter?: StoreGetter) {
    let target: NodeCareCategory = { names: [], threads: [] },
      handler = {
        get: function(target: NodeCareCategory, name: string) {
          let [proxy, keyCareItem] = createStoreProxy();
          target.threads.push({ parent: 0, store: keyCareItem });
        }
      };
    if (storeGetter != null) {
      {
        storeGetter(new Proxy(target, handler) as any);
      }
    }
    this._careCate = target;
  }

  byName(name: string, storeGetter: StoreGetter) {
    let handler = {
      get: function(target: NodeCareCategory, name: string) {
        let [proxy, keyCareItem] = createStoreProxy();
        target.names.push({ name, store: keyCareItem });
      }
    };
    if (storeGetter != null) {
      {
        storeGetter(new Proxy(this._careCate, handler) as any);
      }
    }
    return this;
  }

  byThread(parent: number, storeGetter: StoreGetter) {
    let handler = {
      get: function(target: NodeCareCategory, name: string) {
        let [proxy, keyCareItem] = createStoreProxy();
        target.threads.push({ parent, store: keyCareItem });
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

function storeObserver(
  storeGetter: (storeOptions: Record<string, StoreObserveOptions>) => void
): StoreObserver;
function storeObserver(): StoreObserver;
function storeObserver(storeGetter?: any) {
  return new StoreObserver(storeGetter);
}

export default storeObserver;
