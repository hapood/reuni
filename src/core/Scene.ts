import Node from "./Node";
import { createSceneEntity, actionProxy, asyncActionProxy } from "./utils";
import TransManager from "./TransManager";
import Transaction from "./Transaction";
import { ActionDict } from "./types";
import PropertyType from "../api/PropertyType";
import { cacheDictKey } from "../api/decorator";

export default class Scene {
  private _name: string;
  private _state: any;
  private _nextState: any;
  private _isDestroyed: boolean;
  private _actionDict: ActionDict;
  private _actions: Record<string, () => void>;
  private _node: Node;
  private _entity: new () => any;
  private _transDict: Record<string, Record<string, Transaction>>;

  constructor(sceneName: string, RawScene: new () => any, node: Node) {
    this._name = sceneName;
    let actionsDict: ActionDict = {};
    let stateDict: any = {};
    let rawScene: any = new RawScene();
    let propertyDict = rawScene[cacheDictKey];
    let transation = node.getTransManager();
    let transDict: Record<string, Record<string, Transaction>> = {};
    let bindedActions: Record<string, () => void> = {};
    let oAction;
    Object.entries(propertyDict).forEach(
      ([key, type]: [string, PropertyType]) => {
        switch (type) {
          case PropertyType.OBSERVABLE:
            transDict[key] = {};
            stateDict[key] = rawScene[key];
            break;
          case PropertyType.ACTION:
            oAction = rawScene[key];
            transDict[key] = {};
            actionsDict[key] = {
              type: PropertyType.ACTION,
              action: oAction
            };
            bindedActions[key] = actionProxy.bind(
              null,
              key,
              oAction,
              this.addTrans,
              transation
            );
            break;
          case PropertyType.ASYNC_ACTION:
            oAction = rawScene[key];
            transDict[key] = {};
            actionsDict[key] = {
              type: PropertyType.ASYNC_ACTION,
              action: oAction
            };
            bindedActions[key] = actionProxy.bind(
              null,
              key,
              oAction,
              this.addTrans,
              transation
            );
            break;
        }
      }
    );
    this._state = stateDict;
    this._nextState = Object.assign({}, stateDict);
    this._transDict = transDict;
    this._actionDict = actionsDict;
    this._actions = bindedActions;
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

  getActionDict() {
    return this._actionDict;
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
