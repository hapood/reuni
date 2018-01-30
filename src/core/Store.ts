import Node from "./Node";
import {
  buildStoreEntity,
  taskProxy,
  asyncTaskProxy,
  buildTaskEntity,
  buildStoreDict
} from "./utils";
import TaskManager from "./TaskManager";
import TaskHandler from "../api/TaskHandler";
import { TaskDict, Observer, ObserverCareDict } from "./types";
import PropertyType from "../api/PropertyType";
import ObserveType from "../api/ObserveType";
import { getCache } from "../api/decorator";
import Reuni from "src/core/Reuni";

export default class Store {
  private _name: string;
  private _valueDict: Record<string, true>;
  private _committedState: any;
  private _state: any;
  private _isDestroyed: boolean;
  private _taskDict: TaskDict;
  private _node: Node;
  private _entity: any;
  private _taskDesrDict: Record<string, Record<string, TaskHandler>>;
  private _isValid: boolean;
  private _observer: Observer;
  private _storeDict: Record<string, Store>;
  private _entityState: any;

  constructor(
    storeName: string,
    RawStore: new () => any,
    observer: ObserverCareDict,
    node: Node
  ) {
    this._name = storeName;
    let taskDict: TaskDict = {};
    let valueDict: Record<string, true> = {};
    let state: any = {};
    let rawStore: any = new RawStore();
    let propertyDict = getCache(RawStore.prototype);
    let taskManager = node.getTaskManager();
    let taskDesrDict: Record<string, Record<string, TaskHandler>> = {};
    let tmpTask;
    let storeDict: Record<string, any> = {};
    Object.entries(propertyDict).forEach(([key, item]) => {
      switch (item.type) {
        case PropertyType.VALUE:
          valueDict[key] = true;
          state[key] = rawStore[key];
          break;
        case PropertyType.TASK:
          tmpTask = rawStore[key];
          taskDesrDict[key] = {};
          taskDict[key] = {
            type: PropertyType.TASK,
            task: tmpTask
          };
          break;
        case PropertyType.ASYNC_TASK:
          tmpTask = rawStore[key];
          taskDesrDict[key] = {};
          taskDict[key] = {
            type: PropertyType.ASYNC_TASK,
            task: tmpTask
          };
          break;
        case PropertyType.STORE:
          storeDict[key] = null;
          break;
      }
    });
    this._valueDict = valueDict;
    this._committedState = state;
    this._state = Object.assign({}, state);
    this._taskDesrDict = taskDesrDict;
    this._taskDict = taskDict;
    this._isDestroyed = false;
    this._node = node;
    this._storeDict = storeDict;
    this._isValid = false;
    this._entityState = null;
    this._observer = node
      .getReuni()
      .storeObserve(
        observer,
        node.getId(),
        storeName,
        (isValid, entityDict) => {
          if (this._isValid == false && isValid !== false) {
            let newStoreDict = buildStoreDict(observer, this._node.getReuni());
            Object.keys(this._storeDict).forEach(key => {
              this._storeDict[key] = newStoreDict[key];
            });
          }
          if (isValid !== false) {
            Object.keys(this._storeDict).forEach(key => {
              this.setValue(key, (entityDict as any)[key]);
            });
            this.commit();
          }
          this.setIsValid(isValid);
        }
      );
  }

  getObserver() {
    return this._observer;
  }

  getStoreDict() {
    return this._storeDict;
  }

  isDestroy() {
    return this._isDestroyed;
  }

  setIsValid(isValid: boolean) {
    if (this._isValid !== false && isValid !== true) {
      this._taskDesrDict = {};
    }
    this._isValid = isValid;
  }

  isValid() {
    return this._isValid;
  }

  addTask(taskName: string, t: TaskHandler) {
    let taskDescriptors = this._taskDesrDict[taskName];
    if (taskDescriptors == null) {
      throw new Error(
        `Error occurred while adding task to store [${
          this._name
        }], task name [${taskName}] does not exist.`
      );
    }
    taskDescriptors[t.getId()] = t;
    return t;
  }

  getValueDict() {
    return this._valueDict;
  }

  getNode() {
    return this._node;
  }

  deleteTask(taskName: string, tid: string) {
    let taskDescriptors = this._taskDesrDict[taskName];
    if (taskDescriptors == null) {
      throw new Error(
        `Error occurred while adding task to store [${
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
    this._isDestroyed = true;
  }

  replaceState(state: any) {
    this._node.addDirtyStores(this._name);
    this._state = state;
  }

  setValue(key: string, value: string) {
    this._node.addDirtyStores(this._name);
    this._state[key] = value;
  }

  setState(pState: any) {
    this._node.addDirtyStores(this._name);
    Object.assign(this._state, pState);
  }

  getTaskDict() {
    return this._taskDict;
  }

  getState() {
    return this._state;
  }

  getCommittedState() {
    return this._committedState;
  }

  getEntity() {
    if (this._entityState !== this._committedState) {
      this._entityState = this._committedState;
      this._entity = buildStoreEntity(this, this._node.getReuni());
    }
    return this._entity;
  }

  commit() {
    this._entity = buildStoreEntity(this, this._node.getReuni());
    let oldKeys = Object.keys(this._committedState);
    let newKeys = Object.keys(this._state);
    let dirtyKeyDict: Record<string, boolean> = {};
    oldKeys.concat(newKeys).forEach(key => {
      if (this._committedState[key] !== this._state[key]) {
        dirtyKeyDict[key] = true;
      }
    });
    this._committedState = this._state;
    this._state = Object.assign({}, this._state);
    this._node.updateDirtyStore(this._name, dirtyKeyDict);
  }

  getTaskEntity(t: TaskHandler): any {
    return buildTaskEntity(this, this._node.getReuni(), t);
  }
}
