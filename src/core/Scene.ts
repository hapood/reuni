import SceneAPI from "../api/Scene";
import Node from "./Node";
import { createSceneRegister, createSceneEntity, actionProxy } from "./utils";
import TransManager from "./TransManager";
import Transaction from "./Transaction";

export default class Scene {
  private name: string;
  private state: any;
  private nextState: any;
  private isDestroyed: boolean;
  private oActions: Record<string, () => void>;
  private actions: Record<string, () => void>;
  private node: Node;
  private entity: SceneAPI;
  private transDict: Record<string, Record<string, Transaction>>;

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
    let transation = node.getTransManager();
    let transDict: Record<string, Record<string, Transaction>> = {};
    let oActions = {};
    Object.keys(actionsDict).forEach(key => {
      transDict[key] = {};
      this.oActions[key] = actionsDict;
      actionsDict[key] = actionProxy.bind(
        null,
        key,
        rawScene[key],
        this.addTrans,
        transation
      );
    });
    this.transDict = transDict;
    this.oActions = oActions;
    this.actions = actionsDict;
    this.nextState = Object.assign({}, stateDict);
    this.isDestroyed = false;
    this.node = node;
    this.entity = createSceneEntity(this, stateDict, actionsDict);
  }

  addTrans(actionName: string, t: Transaction) {
    let actionTrans = this.transDict[actionName];
    if (actionTrans == null) {
      throw new Error(
        `Error occurred while adding transaction to scene [${
          this.name
        }], action name [${{
          actionName
        }}] does not exist.`
      );
    }
    actionTrans[t.getId()] = t;
    return t;
  }

  deleteTrans(actionName: string, tid: string) {
    let actionTrans = this.transDict[actionName];
    if (actionTrans == null) {
      throw new Error(
        `Error occurred while adding transaction to scene [${
          this.name
        }], action name [${{
          actionName
        }}] does not exist.`
      );
    }
    let t = actionTrans[tid];
    delete actionTrans[tid];
    return t;
  }

  getName() {
    return this.name;
  }

  destroy() {
    this.isDestroyed = true;
  }

  replaceState(state: any) {
    if (!this.isDestroyed) {
      this.node.addDirtyScenes(this.name);
      this.nextState = state;
    }
  }

  setValue(key: string, value: string) {
    if (!this.isDestroyed) {
      this.node.addDirtyScenes(this.name);
      this.nextState[key] = value;
    }
  }

  setState(pState: any) {
    if (!this.isDestroyed) {
      this.node.addDirtyScenes(this.name);
      Object.assign(this.nextState, pState);
    }
  }

  getOActions() {
    return this.oActions;
  }

  getState() {
    return this.nextState;
  }

  getEntity() {
    return this.entity;
  }

  commit() {
    if (!this.isDestroyed) {
      this.entity = createSceneEntity(this, this.nextState, this.actions);
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
