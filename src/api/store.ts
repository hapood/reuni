import PropertyType from "./PropertyType";
import { getProtoTypeCache } from "./decorator";

function store(storeName: string, nodeName: string = "$") {
  return (target: any, propertyKey: string) => {
    let cache = getProtoTypeCache(target);
    cache[propertyKey] = {
      type: PropertyType.SCENE,
      value: {
        store: storeName,
        node: nodeName
      }
    };
  };
}

export default store as any;
