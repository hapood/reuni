import PropertyType from "./PropertyType";
import { cacheDictKey } from "./decorator";

export type ActionDecorator = {
  (target: Object, propertyKey: string): void;
  async: (target: Object, propertyKey: string) => void;
};

const action = function(target: any, propertyKey: string) {
  let cache = target[cacheDictKey];
  if (cache == null) {
    target[cacheDictKey] = cache = {};
  }
  cache[propertyKey] = { type: PropertyType.ACTION, value: propertyKey };
} as ActionDecorator;

action.async = function(target: any, propertyKey: string) {
  let cache = target[cacheDictKey];
  if (cache == null) {
    target[cacheDictKey] = cache = {};
  }
  cache[propertyKey] = { type: PropertyType.ASYNC_ACTION, value: propertyKey };
};

export default action;
