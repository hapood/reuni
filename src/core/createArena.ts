import Node from "./Node";
import { SceneDict, RawNode, SceneObserver, SceneDictItem } from "./types";
import { buildStateTreeDict, genId } from "./utils";

export class ArenaStore {
  nodeDict: SceneDict;
  rootId: string;

  constructor() {
    let sceneId = genId();
    this.rootId = sceneId;
    let rootNode = new Node(sceneId, "root", null);
    this.nodeDict = {
      [sceneId]: { path: [sceneId], ref: rootNode }
    };
  }

  addNode(treeNode: RawNode, parentId?: string) {
    let nodeId: string | undefined = treeNode.id;
    if (nodeId != null) {
      if (this.nodeDict[nodeId] != null) {
        throw new Error(
          `Error occurred when adding node, id [${nodeId}] already exist.`
        );
      }
    } else {
      while (nodeId == null) {
        nodeId = genId();
        if (this.nodeDict[nodeId] != null) {
          nodeId = undefined;
        }
      }
    }
    let nodePath: string[];
    let pNode: SceneDictItem;
    if (parentId == null) {
      pNode = this.nodeDict[this.rootId];
    } else {
      pNode = this.nodeDict[parentId];
    }
    if (pNode == null) {
      throw new Error(
        `Error occurred when adding node, parent [${parentId}] does not exist.`
      );
    }
    let newNode = new Node(nodeId, treeNode.name, pNode.ref);
    treeNode.scenes.map(node => newNode.addScene(node));
    nodePath = pNode.path.concat(nodeId);
    this.nodeDict[nodeId] = { path: nodePath, ref: newNode };
    pNode.ref.addChild(nodeId, newNode);
  }

  addSubscriber(
    sceneId: string,
    name: string,
    keyList: string[],
    cb: SceneObserver
  ) {
    let node = this.nodeDict[sceneId];
    if (node == null) {
      throw new Error(
        `Error occurred when adding subscriber to node, node [${sceneId}] does not exist.`
      );
    }
    return node.ref.subscribe(name, keyList, cb);
  }
}

export default function createArena(stateTree?: Node) {
  return new ArenaStore();
}
