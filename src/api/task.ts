import PropertyType from "./PropertyType";
import { getCache } from "./decorator";

export type TaskDecorator = {
  (target: Object, propertyKey: string): void;
  async: (target: Object, propertyKey: string) => void;
};

const task = function(target: any, propertyKey: string) {
  let cache = getCache(target);
  cache[propertyKey] = PropertyType.ACTION;
} as TaskDecorator;

task.async = function(target: any, propertyKey: string) {
  let cache = getCache(target);
  cache[propertyKey] = PropertyType.ASYNC_ACTION;
};

export default task;
