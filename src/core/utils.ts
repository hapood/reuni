import { TaskDict, KeyCareItem, NodeNameDict, NodeThreadDict } from "./types";
import PropertyType from "../api/PropertyType";
import ObserveType from "../api/ObserveType";
import Store from "./Store";
import TaskManager from "./TaskManager";
import Task from "../api/TaskDescriptor";
import { tKey, asKey } from "../api/TaskDescriptor";
import TaskStatus from "../api/TaskStatus";
import Reuni from "src/core/Reuni";
import NodeItem from "./Node";
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

export function buildStoreEntity(
  store: Store,
  state: any,
  stateDict: Record<string, boolean>,
  arenaStore: Reuni
): any {
  let handler = {
    get: function(target: Store, name: string | symbol) {
      throwErrorOfStore(target);
      if (stateDict[name] != null) {
        return state[name];
      }
      let taskDict = target.getTaskDict();
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
      throw new Error(
        `Error occurred while reading store [${target.getName()}], unknown property [${name}].`
      );
    },
    set: function(target: Store, name: string, value: any) {
      throwErrorOfStore(target);
      if (stateDict[name] != null) {
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

function buildTaskEntity(store: Store, arenaStore: Reuni, t: Task) {
  let handler = {
    get: function(target: Store, name: string | symbol) {
      throwErrorOfStore(target);
      let state = target.getState();
      let stateDict = target.getStateDict();
      if (stateDict[name] != null) {
        return state[name];
      }
      let taskDict = target.getTaskDict();
      if (taskDict[name] != null) {
        if (t.isCanceled() !== true && t.isDone() !== true) {
          if (taskDict[name].type === PropertyType.ASYNC_TASK) {
            arenaStore.commit();
          }
          return taskRelayProxy.bind(
            null,
            taskDict[name].task,
            target,
            arenaStore,
            t
          );
        }
        return null;
      }
      let storeDict = target.getStoreDict();
      if (storeDict[name] != null) {
        return state[name];
      }
      if (name === tKey) {
        return t;
      }
      if (name === asKey) {
        return arenaStore;
      }
      throw new Error(
        `Error occurred while reading store [${target.getName()}] in task [${t.getId()}], unknown property [${name}].`
      );
    },
    set: function(target: Store, name: string, value: any) {
      throwErrorOfStore(target);
      let state = target.getState();
      let stateDict = target.getStateDict();
      if (stateDict[name] != null) {
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
  arenaStore: Reuni,
  t: Task,
  ...args: any[]
) {
  if (store.isValid() !== false) {
    let entity = buildTaskEntity(store, arenaStore, t);
    return f.apply(entity, args);
  }
  return null;
}

function asyncTaskRelayProxy(
  f: () => void,
  store: Store,
  arenaStore: Reuni,
  t: Task,
  ...args: any[]
) {
  if (store.isValid() !== false) {
    let entity = buildTaskEntity(store, arenaStore, t);
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
  let arenaStore = store.getNode().getArenaStore();
  let taskManager = arenaStore.getTaskManager();
  let t = startStoreTask(store, taskName, taskManager, arenaStore);
  let entity = buildTaskEntity(store, arenaStore, t);
  let r;
  try {
    r = f.apply(entity, args);
    taskManager.finishTask(t.getId());
    arenaStore.commit();
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
  arenaStore: Reuni
) {
  let t = taskManager.startTask();
  store.addTask(taskName, t);
  t.observe((tStatus: TaskStatus) => {
    if (process.env.NODE_ENV !== "production") {
      if (tStatus === TaskStatus.CANCELED) {
        console.info(`Task [${taskName}] is canceled, taskId: ${t.getId()}.`);
      } else {
        console.info(`Task [${taskName}] is done, taskId: ${t.getId()}.`);
      }
    }
    if (tStatus === TaskStatus.CANCELED) {
      store.deleteTask(taskName, t.getId());
      arenaStore.commit();
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
  let arenaStore = store.getNode().getArenaStore();
  let taskManager = arenaStore.getTaskManager();
  let t = startStoreTask(store, taskName, taskManager, arenaStore);
  let entity = buildTaskEntity(store, arenaStore, t);
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
    arenaStore.commit();
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

export function storeObserveMatch(
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
  symbol: symbol;
  name?: string;
  parent?: NodeItem | undefined | null;
}): NodeNameDict {
  let oldNameDict,
    parentNode = node.parent,
    threadSymbol = node.symbol,
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
  symbol: symbol;
  name?: string;
  parent?: NodeItem | undefined | null;
}): NodeThreadDict {
  let oldThreads,
    parentNode = node.parent,
    threadSymbol = node.symbol;
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
