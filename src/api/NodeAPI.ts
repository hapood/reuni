import Store from "../core/Store";
import TaskManager from "../core/TaskManager";
import Node from "../core/Node";
import Reuni from "../core/Reuni";
import ObserveType from "../api/ObserveType";
import { NodeCareCategory } from "./types";
import { ObserverCareDict, NodeNameDict } from "../core/types";

export default class NodeAPI {
  private _nodeItem: Node;

  constructor(nodeItem: Node) {
    this._nodeItem = nodeItem;
  }

  destroy() {
    if (this._nodeItem.isDestroyed() !== true) {
      let id = this._nodeItem.getId();
      this._nodeItem.getArenaStore().unmoutNode(id);
      return id;
    }
    return null;
  }

  getId() {
    return this._nodeItem.getId();
  }

  isDestroy() {
    return this._nodeItem.isDestroyed();
  }

  observe(care: NodeCareCategory, cb: (isValid: boolean) => void) {
    if (this._nodeItem.isDestroyed() !== true) {
      let careDict: ObserverCareDict = {};
      let thread = this._nodeItem.getThread();
      let threadDict = this._nodeItem.getThreadDict();
      let nameDict = this._nodeItem.getNameDict();
      care.threads.forEach(storeOb => {
        let nodeId = threadDict[thread][storeOb.parent];
        let storeName = storeOb.name;
        if (nodeId == null) {
          throw new Error(
            `Error occurred while adding observer to node [${this._nodeItem.getId()}], parent thread node [${
              storeOb.parent
            }] does not exist.`
          );
        }
        let storeDict = careDict[nodeId];
        if (storeDict == null) {
          storeDict = {};
          careDict[nodeId] = storeDict;
        }
        let keyCare = storeDict[storeName];
        if (keyCare == null) {
          storeDict[storeName] = storeOb.store;
        } else {
          throw new Error(
            `Error occurred while adding observer to store [${storeName}] of node [${nodeId}], you can not observe store duplicately.`
          );
        }
      });
      care.names.forEach(nodeName => {
        let nodeId = this._nodeNameDict[nodeName];
        if (nodeId == null) {
          throw new Error(
            `Error occurred while adding observer to node [${
              this._id
            }], parent node with name [${nodeName}] does not exist.`
          );
        }
        newCare[nodeId] = care[nodeName];
      });
      return this._nodeItem.observe(care, cb);
    }
    return null;
  }

  addStore(storeName: string, RawStore: new () => any) {
    let nodeItem = this._nodeItem;
    let store = this._nodeItem
      .getArenaStore()
      .addStore(nodeItem.getId(), storeName, RawStore);
    return store == null ? null : store.getName();
  }

  deleteStore(storeName: string) {
    let nodeItem = this._nodeItem;
    if (nodeItem.isDestroyed() !== true) {
      return this._nodeItem
        .getArenaStore()
        .deleteStore(nodeItem.getId(), storeName);
    }
    return null;
  }

  mountChild(id: string | undefined | null, nodeName: string) {
    let nodeItem = this._nodeItem;
    if (nodeItem.isDestroyed() !== true) {
      return this._nodeItem
        .getArenaStore()
        .mountNode(id, nodeName, nodeItem.getId());
    }
    return null;
  }

  unmountChild(id: string) {
    let nodeItem = this._nodeItem;
    if (nodeItem.isDestroyed() !== true && nodeItem.hasChild(id)) {
      return this._nodeItem.getArenaStore().unmoutNode(id);
    }
    return null;
  }

  findStore(storeName: string, nodeName: string = "$") {
    let nodeItem = this._nodeItem;
    if (nodeItem.isDestroyed() !== true) {
      return this._nodeItem
        .getArenaStore()
        .getStoreEntity(this.getId(), nodeName, storeName);
    }
    return null;
  }
}
