import {
  NodeDict,
  NodeDictItem,
  Observer,
  ObserverCareDict,
  StoreCareDict,
  KeyCareItem,
  StoreValidDict
} from "./types";
import { genId, buildEntityDict, isCbNeeded } from "./utils";
import Store from "./Store";
import NodeAPI from "../api/NodeAPI";
import TaskManager from "./TaskManager";
import Node from "./Node";
import TaskHandler from "src/api/TaskHandler";
import { ObserverCB } from "../api/types";

export default class Reuni {
  private _nodeDict: NodeDict;
  private _rootId: string;
  private _storeObs: Observer[];
  private _observers: Observer[];
  private _storeValidDict: StoreValidDict;
  private _dirtyNodes: Record<string, Record<string, Record<string, boolean>>>;
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
    this._observers = [];
    this._storeObs = [];
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
    id?: string;
    name?: string;
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
    observer: ObserverCareDict = {}
  ) {
    let node = this._nodeDict[nodeId];
    if (node == null) {
      throw new Error(
        `Error occurred while adding store, node [${nodeId}] does not exist.`
      );
    }
    let store = node.ref.addStore(storeName, RawStore, observer);
    let storeValidDict = this._storeValidDict[nodeId];
    if (storeValidDict == null) {
      storeValidDict = {};
      this._storeValidDict[nodeId] = storeValidDict;
    }
    storeValidDict[storeName] = true;
    this._observers.forEach(ob => {
      let careNodeIdList = Object.keys(ob.care);
      let isObserver = false;
      for (let i = 0; i < careNodeIdList.length; i++) {
        let careNodeId = careNodeIdList[i];
        if (careNodeId === nodeId) {
          let careStoreNameList = Object.keys(ob.care[careNodeId]);
          for (let j = 0; j < careStoreNameList.length; j++) {
            if (storeName === careStoreNameList[j]) {
              isObserver = true;
              break;
            }
          }
          break;
        }
      }
      if (isObserver !== false) {
        let isCb = true;
        let careNodeIdList = Object.keys(ob.care);
        for (let i = 0; i < careNodeIdList.length; i++) {
          let nodeId = careNodeIdList[i];
          let validDict = this._storeValidDict[nodeId];
          let storeCareDict = ob.care[nodeId];
          let storeNames = Object.keys(storeCareDict);
          for (let i = 0; i < storeNames.length; i++) {
            let tmpSName = storeNames[i];
            if (validDict[tmpSName] !== true) {
              isCb = false;
              break;
            }
          }
        }
        if (isCb !== false) {
          ob.cb(true, buildEntityDict(ob.care, this));
        }
      }
    });
    return store;
  }

  deleteStore(nodeId: string, storeName: string) {
    let node = this._nodeDict[nodeId];
    if (node == null) {
      throw new Error(
        `Error occurred while deleting store, node [${nodeId}] does not exist.`
      );
    }
    let store = node.ref.deleteStore(storeName) as Store;
    this._storeValidDict[nodeId][storeName] = false;
    this.storeUnobserve([store.getObserver()]);
    this._observers.forEach(observer => {
      let careNodeIdList = Object.keys(observer.care);
      for (let i = 0; i < careNodeIdList.length; i++) {
        let careNodeId = careNodeIdList[i];
        if (careNodeId === nodeId) {
          let storeCareDict = observer.care[careNodeId];
          let careStoreNameList = Object.keys(storeCareDict);
          for (let j = 0; j < careStoreNameList.length; j++) {
            if (storeName === careStoreNameList[j]) {
              observer.cb(false);
              break;
            }
          }
          break;
        }
      }
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
    let [nodeKeys, nodeObs, storeObs] = node.ref.destroy();
    let parent = node.ref.getParent();
    if (parent != null) {
      parent.deleteChild(nodeId);
    }
    nodeKeys.forEach(key => {
      delete this._nodeDict[key];
    });
    delete this._nodeDict[nodeId];
    delete this._storeValidDict[nodeId];
    this.storeUnobserve(storeObs);
    this.unobserve(nodeObs);
    storeObs.concat(nodeObs).forEach(ob => ob.cb(false));
    return node.ref;
  }

  observe(care: ObserverCareDict, cb: ObserverCB) {
    let curObserver: Observer = { care, cb };
    this._observers.push(curObserver);
    return curObserver;
  }

  storeObserve(care: ObserverCareDict, cb: ObserverCB) {
    let curObserver: Observer = { care, cb };
    this._storeObs.push(curObserver);
    return curObserver;
  }

  storeUnobserve(observers: Observer[]) {
    this._storeObs = this._storeObs.filter(
      ob => observers.includes(ob) !== true
    );
  }

  unobserve(observers: Observer[]) {
    this._observers = this._observers.filter(
      ob => observers.includes(ob) !== true
    );
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
    this._storeObs.forEach(ob => {
      let isCb = isCbNeeded(ob, this._dirtyNodes);
      if (isCb !== false) {
        ob.cb(true, buildEntityDict(ob.care, this));
      }
    });
    rootNode.ref.commit();
    this._observers.forEach(ob => {
      let isCb = isCbNeeded(ob, this._dirtyNodes);
      if (isCb !== false) {
        ob.cb(true, buildEntityDict(ob.care, this));
      }
    });
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

  buildTaskEntity(nodeId: string, nodeName: string, t: TaskHandler) {
    return this.getEntity(nodeId, nodeName).buildTaskEntity();
  }
}

export function createReuni(stateTree?: Node) {
  return new Reuni();
}
