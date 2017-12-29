import SceneTree from "./SceneTree";
import { StateTreeDict, Scene } from "./types";
import { buildStateTreeDict } from "./utils";

export class ArenaStore {
  sceneTree: SceneTree<any>;
  sceneTreeDict: StateTreeDict;

  constructor(stateTree?: SceneTree<any>) {
    if (stateTree != null) {
      this.sceneTree = stateTree;
      this.sceneTreeDict = buildStateTreeDict();
    } else {
      this.sceneTree = new SceneTree("root", {});
      this.sceneTreeDict = {};
    }
  }

  addScene<S, A>(scene: Scene<S, A>, parentId?: symbol) {
    let newSceneNode = new SceneTree(scene.id, scene.state);
    let sceneId = Symbol(scene.id);
    let scenePath: symbol[];
    if (parentId == null) {
      scenePath = [sceneId];
      this.sceneTreeDict[sceneId] = {
        path: scenePath
      };
    } else {
      let pNode = this.sceneTreeDict[parentId];
      if (pNode == null) {
        throw new Error(
          `Error occurred when adding scene [${
            scene.id
          }], can not find parent scene node [${parentId}]`
        );
      }
      scenePath = pNode.path.concat(sceneId);
      this.sceneTreeDict[sceneId] = {
        path: scenePath
      };
    }
    this.sceneTree.addChild(scenePath, newSceneNode);
  }
}

export default function createArena(stateTree?: SceneTree<any>) {
  return new ArenaStore(stateTree);
}
