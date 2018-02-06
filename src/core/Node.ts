import Store from "./Store";
import TaskManager from "../core/TaskManager";
import Reuni from "./Reuni";
import {
  Observer,
  ObserverCareDict,
  NodeNameDict,
  NodeThreadDict,
  NodeInitInfo
} from "./types";
import { buildNodeNameDict, buildNodeThreadDict } from "./utils";
import { nodeCareParser } from "../api/utils";
import { ObserverCB } from "../api/types";

export default class Node {
  private _id: string;
  private _name: string;
  private _parent: Node | undefined | null;
  private _children: Record<string, Node>;
  private _stores: Record<string, Store>;
  private _dirtyStores: Record<string, boolean>;
  private _dirtyStoreKeys: Record<string, Record<string, boolean>>;
  private _dirtyNodes: Record<string, boolean>;
  private _isDestroyed: boolean;
  private _reuni: Reuni;
  private _nameDict: NodeNameDict;
  private _threadDict: NodeThreadDict;
  private _thread: symbol;

  constructor(reuni: Reuni, node: NodeInitInfo) {
    this._id = node.id;
    this._name = name;
    this._parent = node.parent;
    this._stores = {};
    this._children = {};
    this._dirtyNodes = {};
    this._dirtyStores = {};
    this._dirtyStoreKeys = {};
    this._isDestroyed = false;
    this._reuni = reuni;
    this._nameDict = buildNodeNameDict(node);
    this._threadDict = buildNodeThreadDict(node);
    this._thread = node.thread;
  }

  getThread() {
    return this._thread;
  }

  getNameDict() {
    return this._nameDict;
  }

  getThreadDict() {
    return this._threadDict;
  }

  getId() {
    return this._id;
  }

  isDestroyed() {
    return this._isDestroyed;
  }

  getParent() {
    return this._parent;
  }

  getNodeNameDict() {
    return this._nameDict;
  }

  destroy() {
    Object.values(this._stores).forEach(store => {
      store.destroy();
    });
    let keys = Object.keys(this._children);
    this._stores = {};
    this._children = {};
    this._isDestroyed = true;
    return keys;
  }

  commit() {
    Object.keys(this._dirtyNodes).forEach(nodeId =>
      this._children[nodeId].commit()
    );
    Object.keys(this._dirtyStores).forEach(storeName =>
      this._stores[storeName].commit()
    );
    let dirtyStores = this._dirtyStoreKeys;
    this._dirtyNodes = {};
    this._dirtyStores = {};
    this._dirtyStoreKeys = {};
    this._reuni.updateDirtyNode(this._id, dirtyStores);
  }

  addDirtyStores(storeName: string) {
    this._dirtyStores[storeName] = true;
    if (this._parent != null) {
      this._parent.addDirtyNode(this._id);
    }
  }

  addDirtyNode(nodeId: string) {
    this._dirtyNodes[nodeId] = true;
    if (this._parent != null) {
      this._parent.addDirtyNode(this._id);
    }
  }

  updateDirtyStore(storeName: string, keyList: Record<string, boolean>) {
    this._dirtyStoreKeys[storeName] = keyList;
  }

  addStore<S extends Record<string, {}>, A>(
    storeName: string,
    RawStore: new () => any,
    storeCare: ObserverCareDict
  ) {
    if (this._stores[storeName] != null) {
      throw new Error(
        `Error occurred while adding store to node [${
          this._id
        }], store [${storeName}] already exist.`
      );
    }
    let store = new Store(storeName, RawStore, storeCare, this);
    this._stores[storeName] = store;
    return store;
  }

  observe(care: ObserverCareDict, cb: ObserverCB) {
    let curObserver = this._reuni.observe(care, this._id, cb);
    return curObserver;
  }

  deleteStore(storeName: string) {
    let store = this._stores[storeName];
    if (this._stores[storeName] == null) {
      throw new Error(
        `Error occurred while deleting store to node [${
          this._id
        }], store [${storeName}] is not exist.`
      );
    }
    store.destroy();
    delete this._stores[storeName];
    return store;
  }

  addChild(id: string, node: Node) {
    if (this._children[id] != null) {
      throw new Error(
        `Error occurred while mounting node [${
          this._id
        }], child [${id}] already exist.`
      );
    }
    this._children[id] = node;
    return node;
  }

  deleteChild(nodeId: string) {
    let child = this._children[nodeId];
    if (child == null) {
      throw new Error(
        `Error occurred while unmounting in node [${
          this._id
        }], child [${nodeId}] does not exist.`
      );
    }
    delete this._children[nodeId];
    return child;
  }

  hasChild(nodeId: string) {
    return this._children[nodeId] != null;
  }

  getTaskManager() {
    return this._reuni.getTaskManager();
  }

  getStores() {
    return this._stores;
  }

  getNode() {
    return this._stores;
  }

  getReuni() {
    return this._reuni;
  }

  getEntity(storeName: string) {
    return this._stores[storeName].getEntity();
  }

  getStore(storeName: string) {
    return this._stores[storeName];
  }
}
