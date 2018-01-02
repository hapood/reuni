import { SceneDict, TransItem, ActionDict, ActionDictItem } from "./types";
import PropertyType from "../api/PropertyType";
import { ScenePropertyRegister } from "../api/types";
import Scene from "./Scene";
import TransManager from "./TransManager";
import Transaction from "./Transaction";
import { tidKey, tmKey } from "../api/Transaction";
import TransactionStatus from "../api/TransactionStatus";

export function genId() {
  return (
    "_" +
    Math.random()
      .toString(36)
      .substr(2, 9)
  );
}

export function createSceneEntity(scene: Scene, state: any, actions: any): any {
  let handler = {
    get: function(target: Scene, name: string) {
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
  transManager: TransManager,
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
        return tActionProxy.bind(null, actions[name], scene, transManager, t);
      }
      if (name === tidKey) {
        return t;
      }
      if (name === tmKey) {
        return transManager;
      }
      throw new Error(
        `Error occurred while reading scene [${scene.getName()}] in transition [${t.getId()}], unknown property [${name}].`
      );
    },
    set: function(target: Scene, name: string, value: any) {
      let state = scene.getState();
      if (state[name] != null) {
        target.setValue(name, value);
        return true;
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
  transManager: TransManager,
  t: Transaction,
  ...args: any[]
) {
  let entity = buildTransactionEntity(scene, transManager, t);
  return tidGetterProxy(f.apply(entity, args), t);
}

function tidGetterProxy<V extends {}>(value: V, t: Transaction) {
  let handler = {
    get: function(target: V, name: any) {
      if (name === tidKey) {
        return t;
      }
      return (target as any)[name];
    }
  };
  return new Proxy(value, handler);
}

export function actionProxy(
  actionName: string,
  f: () => void,
  scene: Scene,
  transManager: TransManager,
  ...args: any[]
) {
  let t = transManager.startTrans();
  scene.addTrans(actionName, t);
  let tid = t.getId();
  t.subscribe((tStatus: TransactionStatus) => {
    if (tStatus === TransactionStatus.CANCELED) {
      scene.deleteTrans(actionName, tid);
    }
  });
  let entity = buildTransactionEntity(scene, transManager, t);
  let r = f.apply(entity, args);
  return tidGetterProxy(r, t);
}

export function asyncActionProxy(
  actionName: string,
  f: () => void,
  scene: Scene,
  transManager: TransManager,
  ...args: any[]
) {
  let t = transManager.startTrans();
  scene.addTrans(actionName, t);
  let tid = t.getId();
  t.subscribe((tStatus: TransactionStatus) => {
    if (tStatus === TransactionStatus.CANCELED) {
      scene.deleteTrans(actionName, tid);
    }
  });
  let entity = buildTransactionEntity(scene, transManager, t);
  let r = f.apply(entity, args);
  r.then(() => {
    transManager.doneTrans(tid);
    scene.deleteTrans(actionName, tid);
  });
  return tidGetterProxy(r, t);
}
