import Scene from "./Scene";
import TaskManager from "../core/TaskManager";
import ArenaStore from "./ArenaStore";
import { Observer } from "./types";

export default class NodeItem {
  private _id: string;
  private _name: string;
  private _parent: NodeItem | undefined | null;
  private _children: Record<string, NodeItem>;
  private _scenes: Record<string, Scene>;
  private _dirtyScenes: Record<string, boolean>;
  private _dirtySceneKeys: Record<string, Record<string, boolean>>;
  private _dirtyNodes: Record<string, boolean>;
  private _isDestroyed: boolean;
  private _arenaStore: ArenaStore;

  constructor(
    id: string,
    name: string,
    arenaStore: ArenaStore,
    parent?: NodeItem
  ) {
    this._id = id;
    this._name = name;
    this._parent = parent;
    this._scenes = {};
    this._children = {};
    this._dirtyNodes = {};
    this._dirtyScenes = {};
    this._dirtySceneKeys = {};
    this._isDestroyed = false;
    this._arenaStore = arenaStore;
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

  hasScenes(sceneNames: string[]) {
    let nullIndex = sceneNames.findIndex(
      sceneName => this._scenes[sceneName] == null
    );
    return nullIndex < 0 ? true : false;
  }

  destroy(): null | string[] {
    let observers: Observer[] = [];
    Object.values(this._scenes).forEach(scene => {
      observers.push(scene.getObserver());
      scene.destroy();
    });
    let nodeKeys = Object.keys(this._children);
    let keys = Object.entries(this._children)
      .map(([key, child]) => child.destroy())
      .reduce(
        (prev, cur) => (cur == null ? prev : (prev as string[]).concat(cur)),
        nodeKeys
      );
    this._scenes = {};
    this._children = {};
    this._isDestroyed = true;
    return keys;
  }

  commit() {
    Object.keys(this._dirtyNodes).forEach(nodeId =>
      this._children[nodeId].commit()
    );
    Object.keys(this._dirtyScenes).forEach(sceneName =>
      this._scenes[sceneName].commit()
    );
    let dirtyScenes = this._dirtySceneKeys;
    this._dirtyNodes = {};
    this._dirtyScenes = {};
    this._dirtySceneKeys = {};
    this._arenaStore.updateDirtyNode(this._id, dirtyScenes);
  }

  addDirtyScenes(sceneName: string) {
    this._dirtyScenes[sceneName] = true;
    if (this._parent != null) {
      this._parent.addDirtyNode(this._id);
    }
  }

  addDirtyNode(nodeId: string) {
    this._dirtyNodes[nodeId] = true;
  }

  updateDirtyScene(sceneName: string, keyList: Record<string, boolean>) {
    this._dirtySceneKeys[sceneName] = keyList;
  }

  addScene<S extends Record<string, {}>, A>(
    sceneName: string,
    RawScene: new () => any
  ) {
    if (this._scenes[sceneName] != null) {
      throw new Error(
        `Error occurred while adding scene to node [${
          this._id
        }], scene [${sceneName}] already exist.`
      );
    }
    let scene = new Scene(sceneName, RawScene, this);
    this._scenes[sceneName] = scene;
    return scene;
  }

  deleteScene(sceneName: string) {
    let scene = this._scenes[sceneName];
    if (this._scenes[sceneName] == null) {
      throw new Error(
        `Error occurred while deleting scene to node [${
          this._id
        }], scene [${sceneName}] is not exist.`
      );
    }
    scene.destroy();
    delete this._scenes[sceneName];
    return scene;
  }

  mountChild(id: string, node: NodeItem) {
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

  unmountChild(nodeId: string) {
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
    return this._arenaStore.getTaskManager();
  }

  getScenes() {
    return this._scenes;
  }

  getNode() {
    return this._scenes;
  }

  getArenaStore() {
    return this._arenaStore;
  }

  subscribe(
    care: Record<string, Record<string, string[]>>,
    cb: (isValid: boolean) => void
  ) {
    let observer = this._arenaStore.subscribe(this._id, care, cb);
    return observer;
  }

  getSceneEntity(sceneName: string) {
    let scene = this._scenes[sceneName];
    if (scene == null) {
      throw new Error(
        `Error occurred while getting scene, scene [${sceneName}] does not exist in node [${
          this._id
        }].`
      );
    }
    return scene.getEntity();
  }

  findSceneEntity(sceneName: string, nodeName = "$") {
    return this._arenaStore.getSceneEntity(this._id, nodeName, sceneName);
  }
}
