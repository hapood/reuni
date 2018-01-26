import PropertyType from "./PropertyType";
import { getProtoTypeCache } from "./decorator";

const cacheItem = { type: PropertyType.VALUE, value: null };

function value(target: any, propertyKey: string) {
  let cache = getProtoTypeCache(target);
  cache[propertyKey] = cacheItem;
}

export default value as any;
