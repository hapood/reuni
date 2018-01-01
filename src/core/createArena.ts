import Node from "./Node";
import { SceneDict, SceneDictItem, Observer } from "./types";
import { genId } from "./utils";
import Scene from "./Scene";
import SceneAPI from "../api/Scene";
import TransManager from "./TransManager";

export class ArenaStore {
  private nodeDict: SceneDict;
  private rootId: string;
  private observers: Observer[];
  private dirtyNodes: Record<string, Record<string, Record<string, boolean>>>;
  private transManager: TransManager;

  constructor() {
    let nodeId = genId();
    this.rootId = nodeId;
    let rootName = "$root";
    let rootNode = new Node(
      nodeId,
      rootName,
      null,
      this.updateDirtyNode,
      this.transManager
    );
    this.nodeDict = {
      [nodeId]: {
        path: [nodeId],
        ref: rootNode,
        nameDict: { $: nodeId },
        name: rootName
      }
    };
    this.transManager = new TransManager();
  }

  updateDirtyNode(
    nodeId: string,
    dirtyScenes: Record<string, Record<string, boolean>>
  ) {
    this.dirtyNodes[nodeId] = dirtyScenes;
  }

  mountNode(nodeId: string, nodeName: string, parentId?: string) {
    let newNodeId: string | undefined | null = nodeId;
    if (newNodeId != null) {
      if (this.nodeDict[newNodeId] != null) {
        throw new Error(
          `Error occurred while mounting node, id [${newNodeId}] already exist.`
        );
      }
    } else {
      while (newNodeId == null) {
        newNodeId = genId();
        if (this.nodeDict[newNodeId] != null) {
          newNodeId = null;
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
        `Error occurred while mounting node, parent [${parentId}] does not exist.`
      );
    }
    if (nodeName.indexOf("$") === 0) {
      throw new Error(
        'Error occurred while mounting node, name of node can not start with "$".'
      );
    }
    let newNode = new Node(
      newNodeId,
      nodeName,
      pNode.ref,
      this.updateDirtyNode,
      this.transManager
    );
    nodePath = pNode.path.concat(nodeId);
    this.nodeDict[nodeId] = {
      path: nodePath,
      ref: newNode,
      name: nodeName,
      nameDict: Object.assign({}, pNode.nameDict, {
        [pNode.name]: parentId,
        $: nodeId
      })
    };
    pNode.ref.mountChild(nodeId, newNode);
    return newNodeId;
  }

  addScene(nodeId: string, sceneName: string, RawScene: typeof SceneAPI) {
    let node = this.nodeDict[nodeId];
    if (node == null) {
      throw new Error(
        `Error occurred while adding scene, node [${nodeId}] does not exist.`
      );
    }
    node.ref.addScene(sceneName, RawScene);
    this.observers.forEach(observer => {
      let careNodeIdList = Object.keys(observer.care);
      for (let i = 0; i < careNodeIdList.length; i++) {
        let careNodeId = careNodeIdList[i];
        if (careNodeId === nodeId) {
          let careSceneNameList = Object.keys(observer.care[careNodeId]);
          for (let j = 0; j < careSceneNameList.length; j++) {
            if (sceneName === careSceneNameList[j]) {
              observer.cb(true);
              break;
            }
          }
          break;
        }
      }
    });
  }

  deleteScene(nodeId: string, sceneName: string) {
    let node = this.nodeDict[nodeId];
    if (node == null) {
      throw new Error(
        `Error occurred while adding scene, node [${nodeId}] does not exist.`
      );
    }
    let scene = node.ref.deleteScene(sceneName);
    this.observers.forEach(observer => {
      let careNodeIdList = Object.keys(observer.care);
      for (let i = 0; i < careNodeIdList.length; i++) {
        let careNodeId = careNodeIdList[i];
        if (careNodeId === nodeId) {
          let careSceneNameList = Object.keys(observer.care[careNodeId]);
          for (let j = 0; j < careSceneNameList.length; j++) {
            if (sceneName === careSceneNameList[j]) {
              observer.cb(false);
              break;
            }
          }
          break;
        }
      }
    });
    return scene;
  }

  unmoutNode(nodeId: string) {
    let node = this.nodeDict[nodeId];
    if (node == null) {
      throw new Error(
        `Error occurred while unmounting node, node [${nodeId}] does not exist.`
      );
    }
    node.ref.unmountChild(nodeId);
    delete this.nodeDict[nodeId];
    this.observers.forEach(observer => {
      let careNodeIdList = Object.keys(observer.care);
      for (let i = 0; i < careNodeIdList.length; i++) {
        let careNodeId = careNodeIdList[i];
        if (careNodeId === nodeId) {
          observer.cb(false);
          break;
        }
      }
    });
    return node.ref;
  }

  subscribe(
    anchorId: string,
    care: Record<string, Record<string, string[]>>,
    cb: (isValid: boolean) => void
  ) {
    let anchorNode = this.nodeDict[anchorId];
    if (anchorNode == null) {
      throw new Error(
        `Error occurred while adding observer, anchor node [${anchorId}] does not exist.`
      );
    }
    let node;
    let newCare: Record<string, Record<string, string[]>> = {};
    Object.keys(care).map(nodeName => {
      if (nodeName == "$") {
        node = anchorNode;
      } else {
        let nodeId = anchorNode.nameDict[nodeName];
        if (nodeId == null) {
          throw new Error(
            `Error occurred while adding observer to node [${anchorId}], parent node with name [${nodeName}] does not exist.`
          );
        }
        node = this.nodeDict[nodeId];
        if (node == null) {
          throw new Error(
            `Error occurred while adding observer to node, node [${nodeId}] does not exist.`
          );
        }
        newCare[nodeId] = care[nodeName];
      }
    });
    let curObserver = { care: newCare, cb };
    this.observers.push(curObserver);
    return curObserver;
  }

  unsubscribe(observers: Observer[]) {
    this.observers = this.observers.filter(
      observer => !observers.includes(observer)
    );
  }

  commit() {
    let rootNode = this.nodeDict[this.rootId];
    if (rootNode == null) {
      throw new Error(
        `Error occurred while committing, root node [${
          this.rootId
        }] does not exist.`
      );
    }
    rootNode.ref.commit();
    this.observers.forEach(observer => {
      let careNodeIdList = Object.keys(observer.care);
      for (let i = 0; i < careNodeIdList.length; i++) {
        let nodeId = careNodeIdList[i];
        let dirtyScenes = this.dirtyNodes[nodeId];
        if (dirtyScenes != null) {
          let careSceneNameList = Object.keys(observer.care[nodeId]);
          for (let j = 0; j < careSceneNameList.length; j++) {
            let sceneName = careSceneNameList[j];
            let dirtyKeys = dirtyScenes[sceneName];
            if (dirtyKeys != null) {
              let careKeyList = Object.keys(observer.care[nodeId][sceneName]);
              for (let k = 0; k < careKeyList.length; k++) {
                let key = careKeyList[k];
                if (dirtyKeys[key] != null) {
                  observer.cb(true);
                }
              }
            }
          }
        }
      }
    });
  }

  getScene(anchorId: string, nodeName: string, sceneName: string) {
    let anchorNode = this.nodeDict[anchorId];
    if (anchorNode == null) {
      throw new Error(
        `Error occurred while getting scene, anchor node [${anchorId}] does not exist.`
      );
    }
    let node;
    if (nodeName == "$") {
      node = anchorNode;
    } else {
      let nodeId = anchorNode.nameDict[nodeName];
      if (nodeId == null) {
        throw new Error(
          `Error occurred while getting scene, parent node with name [${nodeName}] does not exist.`
        );
      }
      node = this.nodeDict[nodeId];
      if (node == null) {
        throw new Error(
          `Error occurred while getting scene, node [${nodeId}] does not exist.`
        );
      }
    }
    return node.ref.getSceneEntity(sceneName);
  }
}

export default function createArena(stateTree?: Node) {
  return new ArenaStore();
}
