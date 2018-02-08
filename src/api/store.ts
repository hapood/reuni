import PropertyType from "./PropertyType";
import { getProtoTypeCache } from "./decorator";
import { CacheItem } from "./types";

const cacheItem: CacheItem = { type: PropertyType.STORE, value: null };

export default function store(target: any, propertyKey: string) {
  let cache = getProtoTypeCache(target);
  cache[propertyKey] = cacheItem;
}
