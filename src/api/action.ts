import Scene from "./Scene";
import PropertyType from "./PropertyType";

export default function action(target: Object, propertyKey: string) {
  let scene: Scene = Object.getPrototypeOf(Object.getPrototypeOf(target));
  scene.register(PropertyType.ACTION, propertyKey);
}
