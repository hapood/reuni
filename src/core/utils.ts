import Node from "./Node";
import { SceneDict, TransItem } from "./types";
import SceneAPI from "../api/Scene";
import PropertyType from "../api/PropertyType";
import { ScenePropertyRegister } from "../api/types";
import Scene from "./Scene";
import TransManager from "./TransManager";
import Transaction from "./Transaction";
import { tidKey } from "../api/Transaction";

export function genId() {
  return (
    "_" +
    Math.random()
      .toString(36)
      .substr(2, 9)
  );
}

export function createSceneRegister(
  stateDict: any,
  actionsDict: any
): ScenePropertyRegister {
  return function(type: PropertyType, key: string) {
    switch (type) {
      case PropertyType.OBSERVABLE:
        stateDict[key] = true;
        break;
      case PropertyType.ACTION:
        stateDict[key] = true;
        break;
      default:
        throw new Error(
          `Error occurred while parsing scene [${
            this.id
          }], unknown property type [${type}].`
        );
    }
  };
}

export function createSceneEntity(
  scene: Scene,
  state: any,
  actions: any
): SceneAPI {
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
  transations: TransManager,
  t: Transaction
) {
  let handler = {
    get: function(target: Scene, name: any) {
      let state = scene.getState();
      if (state[name] != null) {
        return state[name];
      }
      let actions = scene.getOActions();
      if (actions[name] != null) {
        return tActionProxy.bind(null, actions[name], scene, transations, t);
      }
      if (name === tidKey) {
        return t;
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
  transations: TransManager,
  t: Transaction,
  ...args: any[]
) {
  let entity = buildTransactionEntity(scene, transations, t);
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
  transations: TransManager,
  ...args: any[]
) {
  let t = transations.startTrans();
  scene.addTrans(actionName, t);
  let entity = buildTransactionEntity(scene, transations, t);
  let r = f.apply(entity, args);
  let tid = t.getId();
  if (typeof r.then === "function") {
    r.then(() => {
      transations.doneTrans(tid);
      scene.deleteTrans(actionName, tid);
    });
    return tidGetterProxy(r, t);
  } else {
    throw new Error(
      `Error occurred while creating action [${actionName}] in scene [${scene.getName()}], action [${actionName}] is not async action.`
    );
  }
}
