import {
  TaskDict,
  KeyCareItem,
  NodeNameDict,
  NodeThreadDict,
  ObserverCareDict,
  StoreValidDict
} from "./types";
import PropertyType from "../api/PropertyType";
import ObserveType from "../api/ObserveType";
import Store from "./Store";
import TaskManager from "./TaskManager";
import TaskHandler, { tKey, ruKey } from "../api/TaskHandler";
import TaskStatus from "../api/TaskStatus";
import Reuni from "src/core/Reuni";
import Node from "./Node";
import TaskCancelError from "../api/TaskCancelError";
import StoreNotExistError from "../api/StoreNotExistError";
import StoreNotAvailableError from "../api/StoreNotAvailableError";

export function genId() {
  return (
    "_" +
    Math.random()
      .toString(36)
      .substr(2, 9)
  );
}

export function buildStoreEntity(store: Store, reuni: Reuni): any {
  let state = store.getCommittedState();
  let valueDict = store.getValueDict();
  let taskDict = store.getTaskDict();
  let handler = {
    get: function(target: Store, name: string | symbol) {
      if (valueDict[name] != null) {
        return state[name];
      }
      if (taskDict[name] != null) {
        if (taskDict[name].type === PropertyType.TASK) {
          return taskProxy.bind(null, name, taskDict[name].task, target);
        } else {
          return asyncTaskProxy.bind(null, name, taskDict[name].task, target);
        }
      }
      let storeDict = target.getStoreDict();
      if (storeDict[name] != null) {
        return target.getState()[name];
      }
    },
    set: function(target: Store, name: string, value: any) {
      throwErrorOfStore(target);
      if (valueDict[name] != null) {
        target.setValue(name, value);
        return true;
      }
      throw new Error(
        `Error occurred while writting store [${target.getName()}], property [${name}] is not observable.`
      );
    }
  };
  let entity = new Proxy(store, handler);
  return entity as any;
}

export function buildTaskEntity(store: Store, reuni: Reuni, t: TaskHandler) {
  let handler = {
    get: function(target: Store, name: string | symbol) {
      throwErrorOfStore(target);
      let state = target.getState();
      let valueDict = target.getValueDict();
      if (valueDict[name] != null) {
        return state[name];
      }
      let taskDict = target.getTaskDict();
      if (taskDict[name] != null) {
        if (t.isCanceled() !== true && t.isDone() !== true) {
          if (taskDict[name].type === PropertyType.ASYNC_TASK) {
            console.log("commit", name);
            reuni.commit();
          }
          return taskRelayProxy.bind(
            null,
            taskDict[name].task,
            target,
            reuni,
            t
          );
        }
        return null;
      }
      let innerStore = target.getStoreDict()[name];
      if (innerStore != null) {
        return innerStore.getTaskEntity(t);
      }
      if (name === tKey) {
        return t;
      }
      if (name === ruKey) {
        return reuni;
      }
    },
    set: function(target: Store, name: string, value: any) {
      throwErrorOfStore(target);
      let state = target.getState();
      let valueDict = target.getValueDict();
      if (valueDict[name] != null) {
        if (t.isCanceled() !== true && t.isDone() !== true) {
          target.setValue(name, value);
          return true;
        }
        throw new TaskCancelError(
          t.getId(),
          `Can not set [${name}] with value [${value}] in store [${target.getName()}]`
        );
      }
      throw new Error(
        `Error occurred while writting store [${target.getName()}] in task [${t.getId()}], property [${name}] is not observable.`
      );
    }
  };
  let entity = new Proxy(store, handler);
  return entity as any;
}

function taskRelayProxy(
  f: () => void,
  store: Store,
  reuni: Reuni,
  t: TaskHandler,
  ...args: any[]
) {
  if (store.isValid() !== false) {
    let entity = buildTaskEntity(store, reuni, t);
    return f.apply(entity, args);
  }
  return null;
}

function asyncTaskRelayProxy(
  f: () => void,
  store: Store,
  reuni: Reuni,
  t: TaskHandler,
  ...args: any[]
) {
  if (store.isValid() !== false) {
    let entity = buildTaskEntity(store, reuni, t);
    return f.apply(entity, args);
  }
  return null;
}

function throwErrorOfStore(store: Store) {
  if (store.isDestroy() !== false) {
    throw new StoreNotExistError(store);
  }
  if (store.isValid() !== true) {
    throw new StoreNotAvailableError(store);
  }
}

export function taskProxy(
  taskName: string,
  f: () => void,
  store: Store,
  ...args: any[]
) {
  throwErrorOfStore(store);
  let reuni = store.getNode().getReuni();
  let taskManager = reuni.getTaskManager();
  let t = startStoreTask(store, taskName, taskManager, reuni);
  let entity = buildTaskEntity(store, reuni, t);
  let r;
  try {
    r = f.apply(entity, args);
    taskManager.finishTask(t.getId());
    reuni.commit();
    return r;
  } catch (e) {
    if (e instanceof TaskCancelError) {
      if (process.env.NODE_ENV !== "production") {
        console.info(e);
      }
    } else {
      throw e;
    }
  }
  return null;
}

function startStoreTask(
  store: Store,
  taskName: string,
  taskManager: TaskManager,
  reuni: Reuni
) {
  let t = taskManager.startTask();
  store.addTask(taskName, t);
  t.observe((tStatus: TaskStatus) => {
    if (process.env.NODE_ENV !== "production") {
      if (tStatus === TaskStatus.CANCELED) {
        console.info(
          `TaskHandler [${taskName}] is canceled, taskId: ${t.getId()}.`
        );
      } else {
        console.info(
          `TaskHandler [${taskName}] is done, taskId: ${t.getId()}.`
        );
      }
    }
    if (tStatus === TaskStatus.CANCELED) {
      store.deleteTask(taskName, t.getId());
      reuni.commit();
    }
  });
  return t;
}

export function asyncTaskProxy(
  taskName: string,
  f: () => Promise<any>,
  store: Store,
  ...args: any[]
) {
  throwErrorOfStore(store);
  let reuni = store.getNode().getReuni();
  let taskManager = reuni.getTaskManager();
  let t = startStoreTask(store, taskName, taskManager, reuni);
  let entity = buildTaskEntity(store, reuni, t);
  let r = (f.apply(entity, args) as Promise<any>).catch((e: any) => {
    if (e instanceof TaskCancelError) {
      if (process.env.NODE_ENV !== "production") {
        console.info(e);
      }
    } else {
      throw e;
    }
  });
  r.then(() => {
    let tid = t.getId();
    taskManager.finishTask(tid);
    store.deleteTask(taskName, tid);
    console.log("done commit");
    reuni.commit();
  });
  (r as any)[tKey] = t;
  return r;
}

function storeObserveInclude(
  dirtyKeys: Record<string, boolean>,
  keys: string[]
) {
  for (let k = 0; k < keys.length; k++) {
    let key = keys[k];
    if (dirtyKeys[key] != null) {
      return true;
    }
  }
  return false;
}

function storeObserveMatch(
  dirtyKeys: Record<string, boolean>,
  keyObserve: KeyCareItem
) {
  switch (keyObserve.type) {
    case ObserveType.ALL:
      return true;
    case ObserveType.INCLUDE:
      return storeObserveInclude(dirtyKeys, keyObserve.keys);
    case ObserveType.EXCLUDE:
      return storeObserveInclude(dirtyKeys, keyObserve.keys);
    default:
      return false;
  }
}

export function buildNodeNameDict(node: {
  id: string;
  thread: symbol;
  name?: string;
  parent?: Node | undefined | null;
}): NodeNameDict {
  let oldNameDict,
    parentNode = node.parent,
    threadSymbol = node.thread,
    nodeName = node.name;
  if (parentNode != null) {
    oldNameDict = parentNode.getNameDict();
  } else {
    oldNameDict = {};
  }
  if (nodeName == null) {
    return Object.assign({}, oldNameDict);
  }
  let nameItem = oldNameDict[nodeName];
  let newNameItem;
  if (nameItem == null) {
    newNameItem = {
      symbol: threadSymbol,
      ids: [node.id]
    };
  } else {
    if (nameItem.symbol !== threadSymbol) {
      throw new Error(
        `Error occurred generating node name dict, name [${nodeName}] is conflict.`
      );
    }
    newNameItem = Object.assign({}, nameItem, {
      ids: [node.id].concat(nameItem.ids)
    });
  }
  return Object.assign({}, oldNameDict, {
    [nodeName]: newNameItem
  });
}

export function buildNodeThreadDict(node: {
  id: string;
  thread: symbol;
  name?: string;
  parent?: Node | undefined | null;
}): NodeThreadDict {
  let oldThreads,
    parentNode = node.parent,
    threadSymbol = node.thread;
  if (parentNode != null) {
    oldThreads = parentNode.getThreadDict();
  } else {
    oldThreads = {};
  }
  let threadItem = oldThreads[threadSymbol];
  let newThreadItem;
  if (threadItem == null) {
    newThreadItem = [node.id];
  } else {
    newThreadItem = [node.id].concat(threadItem);
  }
  return Object.assign({}, oldThreads, {
    [threadSymbol]: newThreadItem
  });
}

export function buildEntityDict(careDict: ObserverCareDict, reuni: Reuni) {
  let dict: any = {};
  Object.entries(careDict).forEach(([nodeId, storeCareDict]) => {
    Object.entries(storeCareDict).map(([storeName, careItem]) => {
      dict[careItem.rename || storeName] = reuni.getEntity(nodeId, storeName);
    });
  });
  return dict;
}

export function buildStoreDict(careDict: ObserverCareDict, reuni: Reuni) {
  let dict: any = {};
  Object.entries(careDict).forEach(([nodeId, storeCareDict]) => {
    Object.entries(storeCareDict).map(([storeName, careItem]) => {
      dict[careItem.rename || storeName] = reuni.getStore(nodeId, storeName);
    });
  });
  return dict;
}

export function isCareStoreDirty(
  care: ObserverCareDict,
  dirtyNodes: Record<string, Record<string, Record<string, boolean>>>
) {
  let isCb = false;
  let careNodeIdList = Object.keys(care);
  for (let i = 0; i < careNodeIdList.length; i++) {
    let nodeId = careNodeIdList[i];
    let dirtyStores = dirtyNodes[nodeId];
    if (dirtyStores != null) {
      let storeObserve = care[nodeId];
      let careStoreNameList = Object.keys(storeObserve);
      for (let j = 0; j < careStoreNameList.length; j++) {
        let storeName = careStoreNameList[j];
        let dirtyKeys = dirtyStores[storeName];
        if (dirtyKeys != null) {
          let keyObserve = storeObserve[storeName];
          isCb = storeObserveMatch(dirtyKeys, keyObserve);
          if (isCb !== false) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

export function isStoreCare(
  care: ObserverCareDict,
  nodeId: string,
  storeName: string
) {
  let careNodeIdList = Object.keys(care);
  let isCare = false;
  for (let i = 0; i < careNodeIdList.length; i++) {
    let careNodeId = careNodeIdList[i];
    if (careNodeId === nodeId) {
      let careStoreNameList = Object.keys(care[careNodeId]);
      for (let j = 0; j < careStoreNameList.length; j++) {
        if (storeName === careStoreNameList[j]) {
          isCare = true;
          break;
        }
      }
      break;
    }
  }
  return isCare;
}

export function isCareStoreValid(
  care: ObserverCareDict,
  storeValidDict: StoreValidDict
) {
  let isCb = true;
  let careNodeIdList = Object.keys(care);
  for (let i = 0; i < careNodeIdList.length; i++) {
    let nodeId = careNodeIdList[i];
    let storeValid = storeValidDict[nodeId];
    let storeCareDict = care[nodeId];
    let storeNames = Object.keys(storeCareDict);
    for (let i = 0; i < storeNames.length; i++) {
      let storeObj = storeValid[storeNames[i]];
      if (storeObj != null && storeObj.isValid() !== true) {
        isCb = false;
        break;
      }
    }
  }
  return isCb;
}
