import Scene from "../core/Scene";
import TransManager from "../core/TransManager";
import NodeItem from "../core/Node";
import ArenaStore from "../core/ArenaStore";

export default class Node {
  private _nodeItem: NodeItem;
  private _arenaStore: ArenaStore;

  constructor(nodeItem: NodeItem, arenaStore: ArenaStore) {
    this._nodeItem = nodeItem;
    this._arenaStore = arenaStore;
  }

  destroy() {
    if (this._nodeItem.isDestroyed() !== true) {
      let id = this._nodeItem.getId();
      this._arenaStore.unmoutNode(id);
      return id;
    }
    return null;
  }

  getId() {
    if (this._nodeItem.isDestroyed() !== true) {
      return this._nodeItem.getId();
    }
    return null;
  }

  isDestory() {
    return this._nodeItem.isDestroyed();
  }

  addScene(sceneName: string, RawScene: new () => any) {
    let nodeItem = this._nodeItem;
    if (nodeItem.isDestroyed() !== true) {
      let scene = this._arenaStore.addScene(
        nodeItem.getId(),
        sceneName,
        RawScene
      );
      return scene.getName();
    }
    return null;
  }

  deleteScene(sceneName: string) {
    let nodeItem = this._nodeItem;
    if (nodeItem.isDestroyed() !== true) {
      return this._arenaStore.deleteScene(nodeItem.getId(), sceneName);
    }
    return null;
  }

  mountChild(id: string | undefined | null, nodeName: string) {
    let nodeItem = this._nodeItem;
    if (nodeItem.isDestroyed() !== true) {
      return this._arenaStore.mountNode(id, nodeName, nodeItem.getId());
    }
    return null;
  }

  unmountChild(id: string) {
    let nodeItem = this._nodeItem;
    if (nodeItem.isDestroyed() !== true && nodeItem.hasChild(id)) {
      return this._arenaStore.unmoutNode(id);
    }
    return null;
  }

  getScene(sceneName: string) {
    let nodeItem = this._nodeItem;
    if (nodeItem.isDestroyed() !== true) {
      return nodeItem.getSceneEntity(sceneName);
    }
    return null;
  }
}
