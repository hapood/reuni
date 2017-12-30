import Scene from "./Scene";
import { SceneObserver, RawScene } from "./types";

export default class Node {
  id: string;
  name: string;
  scenes: Record<string, Scene<any, any>>;
  children: Record<string, Node>;
  parent: Node | null | undefined;

  constructor(id: string, name: string, parent: Node | null | undefined) {
    this.id = id;
    this.name = name;
    this.parent = parent;
    this.children = {};
    this.scenes = {};
  }

  addScene<S, A>(scene: RawScene<S, A>) {
    if (this.scenes[scene.name] != null) {
      throw new Error(
        `Error occurred when adding scene to node [${this.id}], scene [${
          scene.name
        }] already exist.`
      );
    }
    this.scenes[scene.name] = new Scene(scene);
  }

  subscribe(name: string, keyList: string[], cb: SceneObserver): () => void {
    let child = this.scenes[name];
    if (child == null) {
      throw new Error(
        `Error occurred when adding subscriber to node [${this.id}], child [${{
          name
        }}] does not exist.`
      );
    }
    return child.subscribe(keyList, cb);
  }

  addChild(id: string, node: Node) {
    if (this.children[id] != null) {
      throw new Error(
        `Error occurred when adding subscriber to node [${this.id}], child [${{
          id
        }}] already exist.`
      );
    }
    this.children[id] = node;
  }
}
