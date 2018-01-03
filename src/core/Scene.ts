import Node from "./Node";
import { buildSceneEntity, actionProxy, asyncActionProxy } from "./utils";
import TaskManager from "./TaskManager";
import Task from "../api/TaskDescriptor";
import { TaskDict, Observer } from "./types";
import PropertyType from "../api/PropertyType";
import { getCache, cache } from "../api/decorator";

export default class Scene {
  private _name: string;
  private _state: any;
  private _nextState: any;
  private _isDestroyed: boolean;
  private _actionDict: TaskDict;
  private _actions: Record<string, () => void>;
  private _node: Node;
  private _entity: any;
  private _taskDict: Record<string, Record<string, Task>>;
  private _isValid: boolean;
  private _observer: Observer;

  constructor(sceneName: string, RawScene: new () => any, node: Node) {
    this._name = sceneName;
    let actionsDict: TaskDict = {};
    let stateDict: any = {};
    let rawScene: any = new RawScene();
    let propertyDict = getCache(RawScene.prototype);
    let taskManager = node.getTaskManager();
    let taskDict: Record<string, Record<string, Task>> = {};
    let bindedActions: Record<string, () => void> = {};
    let oAction;
    let subscribeDict: Record<string, Record<string, string[]>> = {};

    Object.entries(propertyDict).forEach(([key, item]) => {
      switch (item.type) {
        case PropertyType.OBSERVABLE:
          taskDict[key] = {};
          stateDict[key] = rawScene[key];
          break;
        case PropertyType.TASK:
          oAction = rawScene[key];
          taskDict[key] = {};
          actionsDict[key] = {
            type: PropertyType.TASK,
            task: oAction
          };
          bindedActions[key] = actionProxy.bind(null, key, oAction, this);
          break;
        case PropertyType.ASYNC_TASK:
          oAction = rawScene[key];
          taskDict[key] = {};
          actionsDict[key] = {
            type: PropertyType.ASYNC_TASK,
            task: oAction
          };
        case PropertyType.SCENE:
          let careScenes = subscribeDict[item.value.nodeName];
          if (subscribeDict[item.value.nodeName] == null) {
            careScenes = {};
            subscribeDict[item.value.nodeName] = careScenes;
          }
          careScenes[item.value.scene] = [];
          break;
      }
    });
    this._state = stateDict;
    this._nextState = Object.assign({}, stateDict);
    this._taskDict = taskDict;
    this._actionDict = actionsDict;
    this._actions = bindedActions;
    this._isDestroyed = false;
    this._node = node;
    this._observer = node.subscribe(subscribeDict, () => {
      this.setIsValid;
    });
    this._entity = buildSceneEntity(this, stateDict, bindedActions);
    this._isValid = false;
  }

  isDestroy() {
    return this._isDestroyed;
  }

  setIsValid(isValid: boolean) {
    this._isValid = isValid;
  }

  isValid() {
    return this._isValid;
  }

  addTask(actionName: string, t: Task) {
    let actionTrans = this._taskDict[actionName];
    if (actionTrans == null) {
      throw new Error(
        `Error occurred while adding task to scene [${
          this._name
        }], action name [${actionName}] does not exist.`
      );
    }
    actionTrans[t.getId()] = t;
    return t;
  }

  getNode() {
    if (this._isDestroyed !== true) {
      return this._node;
    }
    return null;
  }

  deleteTask(actionName: string, tid: string) {
    let actionTrans = this._taskDict[actionName];
    if (actionTrans == null) {
      throw new Error(
        `Error occurred while adding task to scene [${
          this._name
        }], action name [${actionName}] does not exist.`
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
    if (this._isDestroyed !== true) {
      this._isDestroyed = true;
    }
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
      this._entity = buildSceneEntity(this, this._nextState, this._actions);
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
