import PropertyType from "./PropertyType";

export const decoratorCachekey = Symbol("decoratorCache");

export function getCache(target: any) {
  return target[decoratorCachekey];
}

export function getProtoTypeCache(target: any) {
  let cache = target[decoratorCachekey];
  if (cache == null) {
    cache = {};
    target[decoratorCachekey] = cache;
  }
  return cache;
}
