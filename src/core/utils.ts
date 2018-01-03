import { NodeDict, TaskItem, TaskDict, TaskDictItem } from "./types";
import PropertyType from "../api/PropertyType";
import Scene from "./Scene";
import TaskManager from "./TaskManager";
import Task from "../api/TaskDescriptor";
import { tKey, asKey } from "../api/TaskDescriptor";
import TaskStatus from "../api/TaskStatus";
import ArenaStore from "src/core/ArenaStore";
import Node from "./Node";
import TaskCancelError from "../api/TaskCancelError";
import SceneNotExistError from "../api/SceneNotExistError";
import SceneNotAvailableError from "../api/SceneNotAvailableError";

export function genId() {
  return (
    "_" +
    Math.random()
      .toString(36)
      .substr(2, 9)
  );
}

export function buildSceneEntity(
  scene: Scene,
  state: any,
  stateDict: Record<string, boolean>,
  arenaStore: ArenaStore
): any {
  let handler = {
    get: function(target: Scene, name: string | symbol) {
      throwErrorOfScene(target);
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
      throw new Error(
        `Error occurred while reading scene [${target.getName()}], unknown property [${name}].`
      );
    },
    set: function(target: Scene, name: string, value: any) {
      throwErrorOfScene(target);
      if (stateDict[name] != null) {
        target.setValue(name, value);
        return true;
      }
      throw new Error(
        `Error occurred while writting scene [${target.getName()}], property [${name}] is not observable.`
      );
    }
  };
  let entity = new Proxy(scene, handler);
  return entity as any;
}

function buildTaskEntity(scene: Scene, arenaStore: ArenaStore, t: Task) {
  let handler = {
    get: function(target: Scene, name: string | symbol) {
      throwErrorOfScene(target);
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
      if (name === tKey) {
        return t;
      }
      if (name === asKey) {
        return arenaStore;
      }
      throw new Error(
        `Error occurred while reading scene [${target.getName()}] in task [${t.getId()}], unknown property [${name}].`
      );
    },
    set: function(target: Scene, name: string, value: any) {
      throwErrorOfScene(target);
      let state = target.getState();
      let stateDict = target.getStateDict();
      if (stateDict[name] != null) {
        if (t.isCanceled() !== true && t.isDone() !== true) {
          target.setValue(name, value);
          return true;
        }
        throw new TaskCancelError(
          t.getId(),
          `Can not set [${name}] with value [${value}] in scene [${target.getName()}]`
        );
      }
      throw new Error(
        `Error occurred while writting scene [${target.getName()}] in task [${t.getId()}], property [${name}] is not observable.`
      );
    }
  };
  let entity = new Proxy(scene, handler);
  return entity as any;
}

function taskRelayProxy(
  f: () => void,
  scene: Scene,
  arenaStore: ArenaStore,
  t: Task,
  ...args: any[]
) {
  if (scene.isValid() !== false) {
    let entity = buildTaskEntity(scene, arenaStore, t);
    return f.apply(entity, args);
  }
  return null;
}

function throwErrorOfScene(scene: Scene) {
  if (scene.isDestroy() !== false) {
    throw new SceneNotExistError(scene);
  }
  if (scene.isValid() !== true) {
    throw new SceneNotAvailableError(scene);
  }
}

export function taskProxy(
  taskName: string,
  f: () => void,
  scene: Scene,
  ...args: any[]
) {
  throwErrorOfScene(scene);
  let arenaStore = scene.getNode().getArenaStore();
  let taskManager = arenaStore.getTaskManager();
  let t = startSceneTask(scene, taskName, taskManager, arenaStore);
  let entity = buildTaskEntity(scene, arenaStore, t);
  let r = f.apply(entity, args);
  taskManager.finishTask(t.getId());
  arenaStore.commit();
  return r;
}

function startSceneTask(
  scene: Scene,
  taskName: string,
  taskManager: TaskManager,
  arenaStore: ArenaStore
) {
  let t = taskManager.startTask();
  scene.addTask(taskName, t);
  t.subscribe((tStatus: TaskStatus) => {
    if (tStatus === TaskStatus.CANCELED) {
      scene.deleteTask(taskName, t.getId());
      arenaStore.commit();
    }
  });
  return t;
}

export function asyncTaskProxy(
  taskName: string,
  f: () => void,
  scene: Scene,
  ...args: any[]
) {
  throwErrorOfScene(scene);
  let arenaStore = scene.getNode().getArenaStore();
  let taskManager = arenaStore.getTaskManager();
  let t = startSceneTask(scene, taskName, taskManager, arenaStore);
  let entity = buildTaskEntity(scene, arenaStore, t);
  let r = f.apply(entity, args);
  r.then(() => {
    let tid = t.getId();
    taskManager.finishTask(tid);
    scene.deleteTask(taskName, tid);
    arenaStore.commit();
  });
  r[tKey] = t;
  return r;
}
