import Node from "./Node";
import { buildSceneEntity, taskProxy, asyncTaskProxy } from "./utils";
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
  private _taskDict: TaskDict;
  private _taskCreators: Record<string, () => void>;
  private _node: Node;
  private _entity: any;
  private _taskDesrDict: Record<string, Record<string, Task>>;
  private _isValid: boolean;
  private _observer: Observer;

  constructor(sceneName: string, RawScene: new () => any, node: Node) {
    this._name = sceneName;
    let taskDict: TaskDict = {};
    let stateDict: any = {};
    let rawScene: any = new RawScene();
    let propertyDict = getCache(RawScene.prototype);
    let taskManager = node.getTaskManager();
    let taskDesrDict: Record<string, Record<string, Task>> = {};
    let taskCreators: Record<string, () => void> = {};
    let tmpTask;
    let subscribeDict: Record<string, Record<string, string[]>> = {};

    Object.entries(propertyDict).forEach(([key, item]) => {
      switch (item.type) {
        case PropertyType.OBSERVABLE:
          taskDesrDict[key] = {};
          stateDict[key] = rawScene[key];
          break;
        case PropertyType.TASK:
          tmpTask = rawScene[key];
          taskDesrDict[key] = {};
          taskDict[key] = {
            type: PropertyType.TASK,
            task: tmpTask
          };
          taskCreators[key] = taskProxy.bind(null, key, tmpTask, this);
          break;
        case PropertyType.ASYNC_TASK:
          tmpTask = rawScene[key];
          taskDesrDict[key] = {};
          taskDict[key] = {
            type: PropertyType.ASYNC_TASK,
            task: tmpTask
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
    this._taskDesrDict = taskDesrDict;
    this._taskDict = taskDict;
    this._taskCreators = taskCreators;
    this._isDestroyed = false;
    this._node = node;
    this._observer = node.subscribe(subscribeDict, () => {
      this.setIsValid;
    });
    this._entity = buildSceneEntity(this, stateDict, taskCreators);
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

  addTask(taskName: string, t: Task) {
    let taskDescriptors = this._taskDesrDict[taskName];
    if (taskDescriptors == null) {
      throw new Error(
        `Error occurred while adding task to scene [${
          this._name
        }], task name [${taskName}] does not exist.`
      );
    }
    taskDescriptors[t.getId()] = t;
    return t;
  }

  getNode() {
    if (this._isDestroyed !== true) {
      return this._node;
    }
    return null;
  }

  deleteTask(taskName: string, tid: string) {
    let taskDescriptors = this._taskDesrDict[taskName];
    if (taskDescriptors == null) {
      throw new Error(
        `Error occurred while adding task to scene [${
          this._name
        }], task name [${taskName}] does not exist.`
      );
    }
    let t = taskDescriptors[tid];
    delete taskDescriptors[tid];
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

  getTaskDict() {
    return this._taskDict;
  }

  getState() {
    return this._nextState;
  }

  getEntity() {
    return this._entity;
  }

  commit() {
    if (this._isDestroyed !== true) {
      this._entity = buildSceneEntity(this, this._nextState, this._taskCreators);
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
