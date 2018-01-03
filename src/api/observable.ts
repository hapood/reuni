import PropertyType from "./PropertyType";
import { getCache } from "./decorator";

function observable(target: any, propertyKey: string) {
  let cache = getCache(target);
  cache[propertyKey] = PropertyType.OBSERVABLE;
}

export default observable as any;
