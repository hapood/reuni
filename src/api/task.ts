import PropertyType from "./PropertyType";
import { getCache } from "./decorator";

const taskCacheItem = { type: PropertyType.TASK, value: null };
const asyncTaskCacheItem = { type: PropertyType.ASYNC_TASK, value: null };

export type TaskDecorator = {
  (target: Object, propertyKey: string): void;
  async: (target: Object, propertyKey: string) => void;
};

const task = function(target: any, propertyKey: string) {
  let cache = getCache(target);
  cache[propertyKey] = taskCacheItem;
} as TaskDecorator;

task.async = function(target: any, propertyKey: string) {
  let cache = getCache(target);
  cache[propertyKey] = asyncTaskCacheItem;
};

export default task;
