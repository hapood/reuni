import {
  NodeDict,
  NodeDictItem,
  ObserverCareDict,
  StoreCareDict,
  KeyCareItem,
  StoreValidDict,
  Observer,
  DirtyNodes
} from "./types";
import { genId } from "./utils";
import Store from "./Store";
import NodeAPI from "../api/NodeAPI";
import TaskManager from "./TaskManager";
import Node from "./Node";
import TaskHandler from "../api/TaskHandler";
import { ObserverCB } from "../api/types";
import ObManager from "./ObManager";

export default class Reuni {
  private _nodeDict: NodeDict;
  private _rootId: string;
  private _storeObs: ObManager;
  private _observers: ObManager;
  private _storeValidDict: StoreValidDict;
  private _dirtyNodes: DirtyNodes;
  private _taskManager: TaskManager;

  constructor() {
    let nodeId = genId();
    this._rootId = nodeId;
    let rootName = "_root";
    let rootNodeItem = new Node(this, {
      id: nodeId,
      thread: Symbol(rootName)
    });
    this._nodeDict = {
      [nodeId]: {
        path: [nodeId],
        ref: rootNodeItem
      }
    };
    this._taskManager = new TaskManager();
    this._observers = new ObManager();
    this._storeObs = new ObManager();
    this._dirtyNodes = {};
    this._storeValidDict = {};
  }

  getTaskManager() {
    return this._taskManager;
  }

  getNodeDict() {
    return this._nodeDict;
  }

  updateDirtyNode(
    nodeId: string,
    dirtyStores: Record<string, Record<string, boolean>>
  ) {
    this._dirtyNodes[nodeId] = dirtyStores;
  }

  mountNode(node: {
    thread: symbol;
    id?: string | undefined | null;
    name?: string | undefined | null;
    parentId?: string | undefined | null;
  }) {
    let newNodeId: string | undefined | null = node.id,
      parentId = node.parentId,
      nodeName = node.name;
    if (newNodeId != null) {
      if (this._nodeDict[newNodeId] != null) {
        throw new Error(
          `Error occurred while mounting node, id [${newNodeId}] already exist.`
        );
      }
    } else {
      while (newNodeId == null) {
        newNodeId = genId();
        if (this._nodeDict[newNodeId] != null) {
          newNodeId = null;
        }
      }
    }
    let nodePath: string[];
    let pNode: NodeDictItem;
    if (parentId == null) {
      pNode = this._nodeDict[this._rootId];
    } else {
      pNode = this._nodeDict[parentId];
    }
    if (pNode == null) {
      throw new Error(
        `Error occurred while mounting node, parent [${parentId}] does not exist.`
      );
    }
    let newNode = new Node(this, {
      id: newNodeId,
      thread: node.thread,
      name: nodeName,
      parent: pNode.ref
    });
    nodePath = pNode.path.concat(newNodeId);
    this._nodeDict[newNodeId] = {
      path: nodePath,
      ref: newNode
    };
    pNode.ref.addChild(newNodeId, newNode);
    return new NodeAPI(newNode);
  }

  addStore(
    nodeId: string,
    storeName: string,
    RawStore: new () => any,
    storeCare: ObserverCareDict = {}
  ) {
    let node = this._nodeDict[nodeId];
    if (node == null) {
      throw new Error(
        `Error occurred while adding store, node [${nodeId}] does not exist.`
      );
    }
    let storeValidDict = this._storeValidDict[nodeId];
    if (storeValidDict == null) {
      storeValidDict = {};
      this._storeValidDict[nodeId] = storeValidDict;
    }
    let store = node.ref.addStore(storeName, RawStore, storeCare);
    storeValidDict[storeName] = store;
    let beValidObs = this._storeObs.addStoreRefresh(nodeId, storeName, this);
    beValidObs.every(ob => {
      if (ob.storeName != null) {
        this._observers.enableStoreNotify(ob.nodeId, ob.storeName, this) != null;
      }
      return this._observers.getInvalidObs().length !== 0;
    });
    return store;
  }

  getStoreValidDict() {
    return this._storeValidDict;
  }

  deleteStore(nodeId: string, storeName: string) {
    let node = this._nodeDict[nodeId];
    if (node == null) {
      throw new Error(
        `Error occurred while deleting store, node [${nodeId}] does not exist.`
      );
    }
    let store = node.ref.deleteStore(storeName);
    delete this._storeValidDict[nodeId][storeName];
    let storeOb = store.getObserver();
    this.storeUnobserve(storeOb);
    let beInvalidObs = this._storeObs
      .deleteStoreRefresh(nodeId, storeName, this)
      .concat(storeOb);
    beInvalidObs.every(ob => {
      if (ob.storeName != null) {
        this._observers.disableStoreNotify(ob.nodeId, ob.storeName, this) !=
          null;
      }
      return this._observers.getObs().length !== 0;
    });
    return store;
  }

  unmoutNode(nodeId: string) {
    let node = this._nodeDict[nodeId];
    if (node == null) {
      throw new Error(
        `Error occurred while unmounting node, node [${nodeId}] does not exist.`
      );
    }
    let nodeKeys = node.ref.destroy();
    let parent = node.ref.getParent();
    if (parent != null) {
      parent.deleteChild(nodeId);
    }
    nodeKeys.forEach(key => {
      delete this._nodeDict[key];
    });
    delete this._nodeDict[nodeId];
    delete this._storeValidDict[nodeId];
    this._storeObs.umountNodeNotify(nodeId);
    this._observers.umountNodeNotify(nodeId);
    return node.ref;
  }

  observe(care: ObserverCareDict, nodeId: string, cb: ObserverCB) {
    return this._observers.observe(care, nodeId, null, cb, this);
  }

  storeObserve(
    care: ObserverCareDict,
    nodeId: string,
    storeName: string,
    cb: ObserverCB
  ) {
    return this._storeObs.observe(care, nodeId, storeName, cb, this);
  }

  storeUnobserve(observer: Observer) {
    this._storeObs.unobserve(observer);
  }

  unobserve(observer: Observer) {
    this._observers.unobserve(observer);
  }

  commit() {
    let rootNode = this._nodeDict[this._rootId];
    if (rootNode == null) {
      throw new Error(
        `Error occurred while committing, root node [${
          this._rootId
        }] does not exist.`
      );
    }
    rootNode.ref.commit();
    this._storeObs.dirtyNotify(this._dirtyNodes, this);
    rootNode.ref.commit();
    this._observers.dirtyNotify(this._dirtyNodes, this);
    this._dirtyNodes = {};
  }

  getNode(nodeId: string) {
    let nodeItem = this._nodeDict[nodeId];
    return nodeItem.ref;
  }

  getEntity(nodeId: string, storeName: string) {
    let nodeItem = this._nodeDict[nodeId];
    return nodeItem.ref.getEntity(storeName);
  }

  getStore(nodeId: string, storeName: string) {
    let nodeItem = this._nodeDict[nodeId];
    return nodeItem.ref.getStore(storeName);
  }
}

export function createReuni(stateTree?: Node) {
  return new Reuni();
}
