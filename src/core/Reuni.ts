import {
  NodeDict,
  NodeDictItem,
  Observer,
  ObserverCareDict,
  StoreCareDict,
  KeyCareItem,
  StoreValidDict
} from "./types";
import { genId, storeObserveMatch } from "./utils";
import Store from "./Store";
import NodeAPI from "../api/NodeAPI";
import TaskManager from "./TaskManager";
import Node from "./Node";

export default class Reuni {
  private _nodeDict: NodeDict;
  private _rootId: string;
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
      parent: pNode.ref
    });
    nodePath = pNode.path.concat(newNodeId);
    this._nodeDict[newNodeId] = {
      path: nodePath,
      ref: newNode
    };
    pNode.ref.mountChild(newNodeId, newNode);
    return new NodeAPI(newNode);
  }

  addStore(nodeId: string, storeName: string, RawStore: new () => any) {
    let node = this._nodeDict[nodeId];
    if (node == null) {
      throw new Error(
        `Error occurred while adding store, node [${nodeId}] does not exist.`
      );
    }
    let store = node.ref.addStore(storeName, RawStore);
    let storeValidDict = this._storeValidDict[nodeId];
    if (storeValidDict == null) {
      storeValidDict = {};
      this._storeValidDict[nodeId] = storeValidDict;
    }
    storeValidDict[storeName] = true;
    this._observers.forEach(observer => {
      let careNodeIdList = Object.keys(observer.care);
      let isObserver = false;
      for (let i = 0; i < careNodeIdList.length; i++) {
        let careNodeId = careNodeIdList[i];
        if (careNodeId === nodeId) {
          let careStoreNameList = Object.keys(observer.care[careNodeId]);
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
        let careNodeIdList = Object.keys(observer.care);
        for (let i = 0; i < careNodeIdList.length; i++) {
          let nodeId = careNodeIdList[i];
          let validDict = this._storeValidDict[nodeId];
          let storeCareDict = observer.care[nodeId];
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
          observer.cb(true);
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
    this.unobserve([store.getObserver()]);
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
    let nodeKeys = node.ref.destroy();
    let parent = node.ref.getParent();
    if (parent != null) {
      parent.unmountChild(nodeId);
    }
    if (nodeKeys != null) {
      nodeKeys.forEach(key => {
        delete this._nodeDict[key];
      });
    }
    delete this._nodeDict[nodeId];
    delete this._storeValidDict[nodeId];
    let newObservers: Observer[] = [];
    this._observers.forEach(observer => {
      let isValid = true;
      let careNodeIdList = Object.keys(observer.care);
      for (let i = 0; i < careNodeIdList.length; i++) {
        let careNodeId = careNodeIdList[i];
        if (careNodeId === nodeId) {
          isValid = false;
          break;
        }
      }
      if (isValid !== false) {
        newObservers.push(observer);
      }
    });
    this._observers = newObservers;
    return node.ref;
  }

  observe(care: ObserverCareDict, cb: (isValid: boolean) => void) {
    let curObserver: Observer = { care, cb };
    this._observers.push(curObserver);
    return curObserver;
  }

  unobserve(observers: Observer[]) {
    this._observers = this._observers.filter(
      observer => !observers.includes(observer)
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
    this._observers.forEach(observer => {
      let isCb = false;
      let careNodeIdList = Object.keys(observer.care);
      for (let i = 0; i < careNodeIdList.length; i++) {
        let nodeId = careNodeIdList[i];
        let dirtyStores = this._dirtyNodes[nodeId];
        if (dirtyStores != null) {
          let storeObserve = observer.care[nodeId];
          let careStoreNameList = Object.keys(storeObserve);
          for (let j = 0; j < careStoreNameList.length; j++) {
            let storeName = careStoreNameList[j];
            let dirtyKeys = dirtyStores[storeName];
            if (dirtyKeys != null) {
              let keyObserve = storeObserve[storeName];
              isCb = storeObserveMatch(dirtyKeys, keyObserve);
              if (isCb !== false) {
                break;
              }
            }
          }
        }
        if (isCb !== false) {
          observer.cb(true);
          break;
        }
      }
    });
    this._dirtyNodes = {};
  }

  getNode(nodeId: string) {
    let nodeItem = this._nodeDict[nodeId];
    if (nodeItem == null) {
      return null;
    }
    return nodeItem.ref;
  }
}

export function createReuni(stateTree?: Node) {
  return new Reuni();
}
