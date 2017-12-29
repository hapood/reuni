import SceneTree from "./SceneTree";
import { StateTreeDict, Scene, SceneObserver } from "./types";
import { buildStateTreeDict, genId } from "./utils";

export class ArenaStore {
  sceneTree: SceneTree<any>;
  sceneTreeDict: StateTreeDict;

  constructor() {
    let sceneId = genId();
    this.sceneTree = new SceneTree(sceneId, "root", {});
    this.sceneTreeDict = {
      [sceneId]: {
        path: [sceneId]
      }
    };
  }

  addScene<S, A>(scene: Scene<S, A>, parentId?: string) {
    let sceneId: string | undefined = undefined;
    while (sceneId == null) {
      sceneId = genId();
      if (this.sceneTreeDict[sceneId] != null) {
        sceneId = undefined;
      }
    }
    let newScene = new SceneTree(sceneId, scene.name, scene.state);
    let scenePath: string[];
    if (parentId == null) {
      scenePath = [sceneId];
      this.sceneTreeDict[sceneId] = {
        path: scenePath
      };
    } else {
      let pScene = this.sceneTreeDict[parentId];
      if (pScene == null) {
        throw new Error(
          `Error occurred when adding scene, parent scene [${parentId}] does not exist.`
        );
      }
      scenePath = pScene.path.concat(sceneId);
      this.sceneTreeDict[sceneId] = {
        path: scenePath
      };
    }
    this.sceneTree.addChild(scenePath, newScene);
  }

  addSubscriber(sceneId: string, keyList: string[], cb: SceneObserver) {
    let scene = this.sceneTreeDict[sceneId];
    if (scene == null) {
      throw new Error(
        `Error occurred when adding subscriber to scene, scene [${sceneId}] does not exist`
      );
    }
    return this.sceneTree.subscribe(scene.path, keyList, cb);
  }

  addSubscriberR(
    sceneId: string,
    name: string,
    keyList: string[],
    cb: SceneObserver
  ) {
    let scene = this.sceneTreeDict[sceneId];
    if (scene == null) {
      throw new Error(
        `Error occurred when adding reverse subscriber to scene, scene [${sceneId}] does not exist`
      );
    }
    return this.sceneTree.subscribeR(scene.path, keyList, cb);
  }
}

export default function createArena(stateTree?: SceneTree<any>) {
  return new ArenaStore(stateTree);
}
