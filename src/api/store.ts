import PropertyType from "./PropertyType";
import { getProtoTypeCache } from "./decorator";
import ObserveType from "./ObserveType";
export type StoreDecorator = {
  (target: Object, propertyKey: string): void;
  observe: (target: Object, propertyKey: string) => void;
  neglect: (target: Object, propertyKey: string) => void;
};

export type DecoratorValue = {
  store: string;
  node: string;
  observeType: ObserveType;
  keys: string[];
};

type CacheItem = {
  type: PropertyType;
  value: DecoratorValue;
};

function store(storeName: string, nodeName: string = "$"): StoreDecorator {
  let d: any = (target: any, propertyKey: string) => {
    let cache: Record<string, CacheItem> = getProtoTypeCache(target);
    cache[propertyKey] = {
      type: PropertyType.STORE,
      value: {
        store: storeName,
        node: nodeName,
        observeType: ObserveType.ALL,
        keys: []
      }
    };
  };
  d.observe = (keys: string[]) => (target: any, propertyKey: string) => {
    let cache: Record<string, CacheItem> = getProtoTypeCache(target);
    cache[propertyKey] = {
      type: PropertyType.STORE,
      value: {
        store: storeName,
        node: nodeName,
        observeType: ObserveType.INCLUDE,
        keys: keys
      }
    };
  };
  d.neglect = (keys: string[]) => (target: any, propertyKey: string) => {
    let cache: Record<string, CacheItem> = getProtoTypeCache(target);
    cache[propertyKey] = {
      type: PropertyType.STORE,
      value: {
        store: storeName,
        node: nodeName,
        observeType: ObserveType.EXCLUDE,
        keys: keys
      }
    };
  };
  return d;
}

export default store as any;
