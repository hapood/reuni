import Scene from "../core/Scene";
import TaskManager from "../core/TaskManager";
import NodeItem from "../core/Node";
import ArenaStore from "../core/ArenaStore";

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

  addScene(sceneName: string, RawScene: new () => any) {
    let nodeItem = this._nodeItem;
    let scene = this._nodeItem
      .getArenaStore()
      .addScene(nodeItem.getId(), sceneName, RawScene);
    return scene == null ? null : scene.getName();
  }

  deleteScene(sceneName: string) {
    let nodeItem = this._nodeItem;
    if (nodeItem.isDestroyed() !== true) {
      return this._nodeItem
        .getArenaStore()
        .deleteScene(nodeItem.getId(), sceneName);
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

  findScene(sceneName: string, nodeName: string = "$") {
    let nodeItem = this._nodeItem;
    if (nodeItem.isDestroyed() !== true) {
      return this._nodeItem
        .getArenaStore()
        .getSceneEntity(this.getId(), nodeName, sceneName);
    }
    return null;
  }
}
