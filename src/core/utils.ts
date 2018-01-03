import { NodeDict, TransItem, ActionDict, ActionDictItem } from "./types";
import PropertyType from "../api/PropertyType";
import Scene from "./Scene";
import TransManager from "./TransManager";
import Transaction from "../api/Transaction";
import { tKey, asKey } from "../api/Transaction";
import TransactionStatus from "../api/TransactionStatus";
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

function buildTransactionEntity(
  scene: Scene,
  arenaStore: ArenaStore,
  t: Transaction
) {
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
        `Error occurred while reading scene [${scene.getName()}] in transition [${t.getId()}], unknown property [${name}].`
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
        `Error occurred while writting scene [${scene.getName()}] in transition [${t.getId()}], property [${name}] is not observable.`
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
  t: Transaction,
  ...args: any[]
) {
  let entity = buildTransactionEntity(scene, arenaStore, t);
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
    let transManager = arenaStore.getTransManager();
    let t = transManager.startTrans();
    scene.addTrans(actionName, t);
    let tid = t.getId();
    t.subscribe((tStatus: TransactionStatus) => {
      if (tStatus === TransactionStatus.CANCELED) {
        scene.deleteTrans(actionName, tid);
      }
    });
    let entity = buildTransactionEntity(scene, arenaStore, t);
    let r = f.apply(entity, args);
    transManager.doneTrans(tid);
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
    let transManager = arenaStore.getTransManager();
    let t = transManager.startTrans();
    scene.addTrans(actionName, t);
    let tid = t.getId();
    t.subscribe((tStatus: TransactionStatus) => {
      if (tStatus === TransactionStatus.CANCELED) {
        scene.deleteTrans(actionName, tid);
        arenaStore.commit();
      }
    });
    let entity = buildTransactionEntity(scene, arenaStore, t);
    let r = f.apply(entity, args);
    r.then(() => {
      transManager.doneTrans(tid);
      scene.deleteTrans(actionName, tid);
      arenaStore.commit();
    });
    r[tKey] = t;
    return r;
  }
  return null;
}
