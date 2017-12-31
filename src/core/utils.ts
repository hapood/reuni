import Node from "./Node";
import { SceneDict } from "./types";
import SceneAPI from "../api/Scene";
import PropertyType from "../api/PropertyType";
import { ScenePropertyRegister } from "../api/types";
import Scene from "./Scene";

export function buildStateTreeDict(): SceneDict {
  return {};
}

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
  let bindedActions: Record<string, () => void> = {};
  let handler = {
    get: function(target: Scene, name: string) {
      if (state[name] != null) {
        return state[name];
      }
      if (bindedActions[name] != null) {
        return bindedActions[name];
      }
      throw new Error(
        `Error occurred while reading scene [${
          scene.name
        }], unknown property [${name}].`
      );
    },
    set: function(target: Scene, name: string, value: any) {
      if (state[name] != null) {
        target.setValue(name, value);
        return true;
      }
      throw new Error(
        `Error occurred while writting scene [${
          scene.name
        }], property [${name}] is not observable.`
      );
    }
  };
  let entity = new Proxy(scene, handler);
  Object.keys(actions).forEach(key => {
    let bindedAction = actions[key].bind(entity);
    bindedActions[key] = actionProxy.bind(this, bindedAction);
  });
  return entity as any;
}

export function actionProxy(f: () => void, ...args: any[]) {
  return f(...args);
}
