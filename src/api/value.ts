import PropertyType from "./PropertyType";
import { getProtoTypeCache } from "./decorator";
import { CacheItem } from "./types";

const cacheItem: CacheItem = { type: PropertyType.VALUE, value: null };

function value(target: any, propertyKey: string) {
  let cache = getProtoTypeCache(target);
  cache[propertyKey] = cacheItem;
}

export default value;
