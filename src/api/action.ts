import Scene from "./Scene";
import PropertyType from "./PropertyType";

export type ActionDecorator = {
  (target: Object, propertyKey: string): void;
  async: (target: Object, propertyKey: string) => void;
};
const action = function(target: Object, propertyKey: string) {
  let scene: Scene = Object.getPrototypeOf(Object.getPrototypeOf(target));
  scene.register(PropertyType.ACTION, propertyKey);
} as ActionDecorator;

action.async = function(target: Object, propertyKey: string) {
  let scene: Scene = Object.getPrototypeOf(Object.getPrototypeOf(target));
  scene.register(PropertyType.ASYNC_ACTION, propertyKey);
};

export default action;
