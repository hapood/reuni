import PropertyType from "./PropertyType";
import { getCache } from "./decorator";

export type ActionDecorator = {
  (target: Object, propertyKey: string): void;
  async: (target: Object, propertyKey: string) => void;
};

const action = function(target: any, propertyKey: string) {
  let cache = getCache(target);
  cache[propertyKey] = PropertyType.ACTION;
} as ActionDecorator;

action.async = function(target: any, propertyKey: string) {
  let cache = getCache(target);
  cache[propertyKey] = PropertyType.ASYNC_ACTION;
};

export default action;
