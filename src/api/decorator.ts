import PropertyType from "./PropertyType";
import { CacheItem } from "./types";

export const decoratorCachekey = Symbol("decoratorCache");

export function getCache(target: any) {
  return target[decoratorCachekey] as Record<string, CacheItem>;
}

export function getProtoTypeCache(target: any) {
  let cache = target[decoratorCachekey];
  if (cache == null) {
    cache = {};
    target[decoratorCachekey] = cache;
  }
  return cache;
}
