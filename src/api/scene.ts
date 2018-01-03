import PropertyType from "./PropertyType";
import { getCache } from "./decorator";

function scene(sceneName: string, nodeName: string = "$") {
  return (target: any, propertyKey: string) => {
    let cache = getCache(target);
    cache[propertyKey] = {
      type: PropertyType.SCENE,
      value: {
        scene: sceneName,
        node: nodeName
      }
    };
  };
}

export default scene as any;
