import { ScenePropertyCache } from "./types";
import PropertyType from "./PropertyType";

export const cache: ScenePropertyCache = { ref: null, dict: {} };

export function getCache(target: any) {
  if (cache.ref !== target) {
    cache.ref = target;
    cache.dict = {};
  }
  return cache.dict;
}
