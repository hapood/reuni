import NodeItem from "./Node";
import { buildStoreEntity, taskProxy, asyncTaskProxy } from "./utils";
import TaskManager from "./TaskManager";
import Task from "../api/TaskDescriptor";
import { TaskDict, Observer } from "./types";
import PropertyType from "../api/PropertyType";
import { getCache } from "../api/decorator";
import Reuni from "src/core/Reuni";

export default class Store {
  private _name: string;
  private _stateDict: Record<string, true>;
  private _committedState: any;
  private _state: any;
  private _isDestroyed: boolean;
  private _taskDict: TaskDict;
  private _node: NodeItem;
  private _entity: any;
  private _taskDesrDict: Record<string, Record<string, Task>>;
  private _isValid: boolean;
  private _observer: Observer;
  private _storeDict: Record<
    string,
    {
      node: string;
      store: string;
    }
  >;

  constructor(storeName: string, RawStore: new () => any, node: NodeItem) {
    this._name = storeName;
    let taskDict: TaskDict = {};
    let stateDict: Record<string, true> = {};
    let state: any = {};
    let rawStore: any = new RawStore();
    let propertyDict = getCache(RawStore.prototype);
    let taskManager = node.getTaskManager();
    let taskDesrDict: Record<string, Record<string, Task>> = {};
    let tmpTask;
    let subscribeDict: Record<string, Record<string, string[]>> = {
      $: { [storeName]: [] }
    };
    let storeDict: Record<
      string,
      {
        node: string;
        store: string;
      }
    > = {};
    Object.entries(propertyDict).forEach(([key, item]) => {
      switch (item.type) {
        case PropertyType.OBSERVABLE:
          taskDesrDict[key] = {};
          stateDict[key] = true;
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
        case PropertyType.SCENE:
          let value: { store: string; node: string } = item.value;
          let careStores = subscribeDict[value.node];
          if (subscribeDict[value.node] == null) {
            careStores = {};
            subscribeDict[value.node] = careStores;
          }
          careStores[value.store] = [];
          storeDict[key] = value;
          break;
      }
    });
    this._stateDict = stateDict;
    this._committedState = state;
    this._state = Object.assign({}, state);
    this._taskDesrDict = taskDesrDict;
    this._taskDict = taskDict;
    this._isDestroyed = false;
    this._node = node;
    this._observer = node.subscribe(subscribeDict, isValid => {
      this.setIsValid(isValid);
    });
    this._storeDict = storeDict;
    this._entity = buildStoreEntity(
      this,
      state,
      stateDict,
      node.getArenaStore()
    );
    this._isValid = false;
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
    this._isValid = isValid;
    Object.entries(this._storeDict).forEach(([storeName, nodeName]) => {
      this._state[storeName] = this._node.findStoreEntity(
        nodeName.store,
        nodeName.node
      );
    });
  }

  isValid() {
    return this._isValid;
  }

  addTask(taskName: string, t: Task) {
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

  getStateDict() {
    return this._stateDict;
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

  getEntity() {
    return this._entity;
  }

  commit() {
    this._entity = buildStoreEntity(
      this,
      this._state,
      this._stateDict,
      this._node.getArenaStore()
    );
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
}
