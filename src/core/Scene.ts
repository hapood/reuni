import SceneAPI from "../api/Scene";
import Node from "./Node";
import { createSceneRegister, createSceneEntity, actionProxy } from "./utils";

export default class Scene {
  name: string;
  state: any;
  nextState: any;
  isDestroyed: boolean;
  actions: Record<string, () => void>;
  node: Node;
  entity: SceneAPI;
  tasks: any[];

  constructor(sceneName: string, RawScene: typeof SceneAPI, node: Node) {
    this.name = sceneName;
    let actionsDict: any = {};
    let stateDict: any = {};
    let rawScene: any = new RawScene(
      createSceneRegister(stateDict, actionsDict)
    );
    Object.keys(stateDict).forEach(key => {
      stateDict[key] = rawScene[key];
    });
    this.state = stateDict;
    this.nextState = Object.assign({}, stateDict);
    this.isDestroyed = false;
    this.node = node;
    this.entity = createSceneEntity(this, stateDict, actionsDict);
    Object.keys(stateDict).forEach(key => {
      let action = rawScene[key].bind(this.entity);
      actionsDict[key] = actionProxy.bind(this, action);
    });
    this.tasks = [];
  }

  addTask(){
    
  }

  destroy() {
    this.isDestroyed = true;
  }

  getState() {
    return this.nextState;
  }

  replaceState(state: any) {
    if (!this.isDestroyed) {
      this.nextState = state;
    }
  }

  getActions() {
    return this.actions;
  }

  setValue(key: string, value: string) {
    if (!this.isDestroyed) {
      this.nextState[key] = value;
    }
  }

  setState(pState: any) {
    if (!this.isDestroyed) {
      Object.assign(this.nextState, pState);
    }
  }

  getEntity() {
    return this.entity;
  }

  commit() {
    if (!this.isDestroyed) {
      let oldKeys = Object.keys(this.state);
      let newKeys = Object.keys(this.nextState);
      let dirtyKeyDict: Record<string, boolean> = {};
      oldKeys.concat(newKeys).forEach(key => {
        if (this.state[key] !== this.nextState[key]) {
          dirtyKeyDict[key] = true;
        }
      });
      this.state = this.nextState;
      this.nextState = Object.assign({}, this.nextState);
      this.node.updateDirtyScene(this.name, dirtyKeyDict);
    }
  }
}
