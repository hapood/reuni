import SceneAPI from "../api/Scene";
import Node from "./Node";
import { createSceneRegister, createSceneEntity, actionProxy } from "./utils";
import TransManager from "./TransManager";
import Transaction from "./Transaction";

export default class Scene {
  private _name: string;
  private _state: any;
  private _nextState: any;
  private _isDestroyed: boolean;
  private _oActions: Record<string, () => void>;
  private _actions: Record<string, () => void>;
  private _node: Node;
  private _entity: SceneAPI;
  private _transDict: Record<string, Record<string, Transaction>>;

  constructor(sceneName: string, RawScene: typeof SceneAPI, node: Node) {
    this._name = sceneName;
    let actionsDict: any = {};
    let stateDict: any = {};
    let rawScene: any = new RawScene(
      createSceneRegister(stateDict, actionsDict)
    );
    Object.keys(stateDict).forEach(key => {
      stateDict[key] = rawScene[key];
    });
    this._state = stateDict;
    let transation = node.getTransManager();
    let transDict: Record<string, Record<string, Transaction>> = {};
    let oActions = {};
    Object.keys(actionsDict).forEach(key => {
      transDict[key] = {};
      this._oActions[key] = actionsDict;
      actionsDict[key] = actionProxy.bind(
        null,
        key,
        rawScene[key],
        this.addTrans,
        transation
      );
    });
    this._transDict = transDict;
    this._oActions = oActions;
    this._actions = actionsDict;
    this._nextState = Object.assign({}, stateDict);
    this._isDestroyed = false;
    this._node = node;
    this._entity = createSceneEntity(this, stateDict, actionsDict);
  }

  addTrans(actionName: string, t: Transaction) {
    let actionTrans = this._transDict[actionName];
    if (actionTrans == null) {
      throw new Error(
        `Error occurred while adding transaction to scene [${
          this._name
        }], action name [${{
          actionName
        }}] does not exist.`
      );
    }
    actionTrans[t.getId()] = t;
    return t;
  }

  deleteTrans(actionName: string, tid: string) {
    let actionTrans = this._transDict[actionName];
    if (actionTrans == null) {
      throw new Error(
        `Error occurred while adding transaction to scene [${
          this._name
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
    return this._name;
  }

  destroy() {
    this._isDestroyed = true;
  }

  replaceState(state: any) {
    if (this._isDestroyed !== true) {
      this._node.addDirtyScenes(this._name);
      this._nextState = state;
    }
  }

  setValue(key: string, value: string) {
    if (this._isDestroyed !== true) {
      this._node.addDirtyScenes(this._name);
      this._nextState[key] = value;
    }
  }

  setState(pState: any) {
    if (this._isDestroyed !== true) {
      this._node.addDirtyScenes(this._name);
      Object.assign(this._nextState, pState);
    }
  }

  getOActions() {
    return this._oActions;
  }

  getState() {
    return this._nextState;
  }

  getEntity() {
    return this._entity;
  }

  commit() {
    if (this._isDestroyed !== true) {
      this._entity = createSceneEntity(this, this._nextState, this._actions);
      let oldKeys = Object.keys(this._state);
      let newKeys = Object.keys(this._nextState);
      let dirtyKeyDict: Record<string, boolean> = {};
      oldKeys.concat(newKeys).forEach(key => {
        if (this._state[key] !== this._nextState[key]) {
          dirtyKeyDict[key] = true;
        }
      });
      this._state = this._nextState;
      this._nextState = Object.assign({}, this._nextState);
      this._node.updateDirtyScene(this._name, dirtyKeyDict);
    }
  }
}
