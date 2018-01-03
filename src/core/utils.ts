import { NodeDict, TaskItem, ActionDict, ActionDictItem } from "./types";
import PropertyType from "../api/PropertyType";
import Scene from "./Scene";
import TaskManager from "./TaskManager";
import Task from "../api/TaskDescriptor";
import { tKey, asKey } from "../api/TaskDescriptor";
import TaskStatus from "../api/TaskStatus";
import ArenaStore from "src/core/ArenaStore";
import Node from "./Node";

export function genId() {
  return (
    "_" +
    Math.random()
      .toString(36)
      .substr(2, 9)
  );
}

export function buildSceneEntity(scene: Scene, state: any, actions: any): any {
  let handler = {
    get: function(target: Scene, name: string | symbol) {
      if (state[name] != null) {
        return state[name];
      }
      if (actions[name] != null) {
        return actions[name];
      }
      throw new Error(
        `Error occurred while reading scene [${scene.getName()}], unknown property [${name}].`
      );
    },
    set: function(target: Scene, name: string, value: any) {
      if (state[name] != null) {
        target.setValue(name, value);
        return true;
      }
      throw new Error(
        `Error occurred while writting scene [${scene.getName()}], property [${name}] is not observable.`
      );
    }
  };
  let entity = new Proxy(scene, handler);
  return entity as any;
}

function buildTaskEntity(scene: Scene, arenaStore: ArenaStore, t: Task) {
  let handler = {
    get: function(target: Scene, name: any) {
      let state = scene.getState();
      if (state[name] != null) {
        return state[name];
      }
      let actions = scene.getActionDict();
      if (actions[name] != null) {
        if (t.isCanceled() !== true && t.isDone() !== true) {
          if (actions[name].type === PropertyType.ASYNC_ACTION) {
            arenaStore.commit();
          }
          return tActionProxy.bind(
            null,
            actions[name].action,
            scene,
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
        `Error occurred while reading scene [${scene.getName()}] in task [${t.getId()}], unknown property [${name}].`
      );
    },
    set: function(target: Scene, name: string, value: any) {
      let state = scene.getState();
      if (state[name] != null) {
        if (t.isCanceled() !== true && t.isDone() !== true) {
          target.setValue(name, value);
          return true;
        }
        return false;
      }
      throw new Error(
        `Error occurred while writting scene [${scene.getName()}] in task [${t.getId()}], property [${name}] is not observable.`
      );
    }
  };
  let entity = new Proxy(scene, handler);
  return entity as any;
}

function tActionProxy(
  f: () => void,
  scene: Scene,
  arenaStore: ArenaStore,
  t: Task,
  ...args: any[]
) {
  let entity = buildTaskEntity(scene, arenaStore, t);
  return f.apply(entity, args);
}

export function actionProxy(
  actionName: string,
  f: () => void,
  scene: Scene,
  ...args: any[]
) {
  if (scene.isDestroy() !== true) {
    let arenaStore = (scene.getNode() as Node).getArenaStore() as ArenaStore;
    let taskManager = arenaStore.getTaskManager();
    let t = taskManager.startTask();
    scene.addTask(actionName, t);
    let tid = t.getId();
    t.subscribe((tStatus: TaskStatus) => {
      if (tStatus === TaskStatus.CANCELED) {
        scene.deleteTask(actionName, tid);
      }
    });
    let entity = buildTaskEntity(scene, arenaStore, t);
    let r = f.apply(entity, args);
    taskManager.finishTask(tid);
    arenaStore.commit();
    return r;
  }
  return null;
}

export function asyncActionProxy(
  actionName: string,
  f: () => void,
  scene: Scene,
  ...args: any[]
) {
  if (scene.isDestroy() !== true) {
    let arenaStore = (scene.getNode() as Node).getArenaStore() as ArenaStore;
    let taskManager = arenaStore.getTaskManager();
    let t = taskManager.startTask();
    scene.addTask(actionName, t);
    let tid = t.getId();
    t.subscribe((tStatus: TaskStatus) => {
      if (tStatus === TaskStatus.CANCELED) {
        scene.deleteTask(actionName, tid);
        arenaStore.commit();
      }
    });
    let entity = buildTaskEntity(scene, arenaStore, t);
    let r = f.apply(entity, args);
    r.then(() => {
      taskManager.finishTask(tid);
      scene.deleteTask(actionName, tid);
      arenaStore.commit();
    });
    r[tKey] = t;
    return r;
  }
  return null;
}
