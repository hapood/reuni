import ObserveType from "./ObserveType";
import { ThreadStoreCare, NameStoreCare, NodeCareCategory } from "./types";
import { KeyCareItem } from "../core/types";

export type StoreGetter<K extends string> = (
  storeOptions: Record<string, KeyCare>
) => Record<K, KeyCare>;

export class KeyCare {
  private _keyCareItem: KeyCareItem;
  private _name: string;

  constructor(name: string) {
    this._keyCareItem = {
      type: ObserveType.ALL,
      keys: [],
      rename: null
    };
    this._name = name;
  }

  getName() {
    return this._name;
  }

  getKeyCareItem() {
    return this._keyCareItem;
  }

  includes(keys: string[]) {
    this._keyCareItem.type = ObserveType.INCLUDE;
    this._keyCareItem.keys = keys;
    return this;
  }

  excludes(keys: string[]) {
    this._keyCareItem.type = ObserveType.EXCLUDE;
    this._keyCareItem.keys = keys;
    return this;
  }
}

export default class StoreObserver<K extends string> {
  private _careCate: NodeCareCategory;

  constructor(storeGetter?: StoreGetter<K>) {
    let target: NodeCareCategory = { names: [], threads: [] },
      handler = {
        get: function(target: NodeCareCategory, name: string) {
          let keyCare = new KeyCare(name);
          return keyCare;
        }
      };
    this._careCate = target;
    if (storeGetter != null) {
      let mapper = storeGetter(new Proxy(target, handler) as any);
      Object.entries(mapper).forEach(([newName, keyCare]: [string, KeyCare]) =>
        this._careCate.threads.push({
          name: keyCare.getName(),
          parent: 0,
          store: keyCare.getKeyCareItem(),
          rename: newName
        })
      );
    }
  }

  getCareCate() {
    return this._careCate;
  }

  byName<NK extends string>(
    nodeName: string,
    storeGetter: StoreGetter<NK>
  ): StoreObserver<K & NK> {
    let handler = {
      get: function(target: NodeCareCategory, name: string) {
        let keyCare = new KeyCare(name);
        return keyCare;
      }
    };
    if (storeGetter != null) {
      let mapper = storeGetter(new Proxy(this._careCate, handler) as any);
      Object.entries(mapper).forEach(([newName, keyCare]: [string, KeyCare]) =>
        this._careCate.names.push({
          name: keyCare.getName(),
          nodeName,
          store: keyCare.getKeyCareItem(),
          rename: newName
        })
      );
    }
    return this;
  }

  byThread<TK extends string>(
    storeGetter: StoreGetter<TK>,
    parent: number = 1
  ): StoreObserver<K & TK> {
    let handler = {
      get: function(target: NodeCareCategory, name: string) {
        let keyCare = new KeyCare(name);
        return keyCare;
      }
    };
    if (storeGetter != null) {
      let mapper = storeGetter(new Proxy(this._careCate, handler) as any);
      Object.entries(mapper).forEach(([newName, keyCare]: [string, KeyCare]) =>
        this._careCate.threads.push({
          name: keyCare.getName(),
          parent,
          store: keyCare.getKeyCareItem(),
          rename: newName
        })
      );
    }
    return this;
  }
}

export function storeObserver<K extends string>(
  storeGetter: StoreGetter<K>
): StoreObserver<K>;
export function storeObserver(): StoreObserver<never>;
export function storeObserver(storeGetter?: any) {
  return new StoreObserver(storeGetter);
}
