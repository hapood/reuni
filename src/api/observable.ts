import PropertyType from "./PropertyType";
import { getProtoTypeCache } from "./decorator";

const cacheItem = { type: PropertyType.OBSERVABLE, value: null };

function observable(target: any, propertyKey: string) {
  let cache = getProtoTypeCache(target);
  cache[propertyKey] = cacheItem
}

export default observable as any;
