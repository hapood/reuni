import PropertyType from "./PropertyType";
import { getCache } from "./decorator";

const cacheItem = { type: PropertyType.OBSERVABLE, value: null };

function observable(target: any, propertyKey: string) {
  let cache = getCache(target);
  cache[propertyKey] = cacheItem
}

export default observable as any;
