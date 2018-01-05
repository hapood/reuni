import Store from "../core/Store";
import TaskManager from "../core/TaskManager";
import NodeItem from "../core/Node";
import Reuni from "../core/Reuni";

export default class Node {
  private _nodeItem: NodeItem;

  constructor(nodeItem: NodeItem) {
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

  subscribe(
    care: Record<string, Record<string, string[]>>,
    cb: (isValid: boolean) => void
  ) {
    return this._nodeItem.subscribe(care, cb);
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
