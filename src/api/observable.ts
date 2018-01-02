import PropertyType from "./PropertyType";
import { cacheDictKey } from "./decorator";

function observable(target: any, propertyKey: string) {
  let cache = target[cacheDictKey];
  if (cache == null) {
    target[cacheDictKey] = cache = {};
  }
  cache[propertyKey] = { type: PropertyType.OBSERVABLE, value: propertyKey };
}

export default observable as any;
