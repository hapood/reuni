import PropertyType from "./PropertyType";
import { getProtoTypeCache } from "./decorator";

export type StoreDecorator = {
  (target: Object, propertyKey: string): void;
  async: (target: Object, propertyKey: string) => void;
};

function store(storeName: string, nodeName: string = "$") {
  let d: any = (target: any, propertyKey: string) => {
    let cache = getProtoTypeCache(target);
    cache[propertyKey] = {
      type: PropertyType.SCENE,
      value: {
        store: storeName,
        node: nodeName
      }
    };
  };
  d.observe = null;
  d.observe = null;
  return d;
}

export default store as any;
