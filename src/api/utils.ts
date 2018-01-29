import { ObserverCareDict, NodeNameDict } from "../core/types";
import { NodeCareCategory } from "./types";
import Node from "../core/Node";

function fillAndGetStoreDict(careDict: ObserverCareDict, nodeId: string) {
  let storeDict = careDict[nodeId];
  if (storeDict == null) {
    storeDict = {};
    careDict[nodeId] = storeDict;
  }
  return storeDict;
}

export function nodeCareParser(care: NodeCareCategory, node: Node) {
  let careDict: ObserverCareDict = {};
  let thread = node.getThread();
  let threadDict = node.getThreadDict();
  let nameDict = node.getNameDict();
  care.threads.forEach(storeOb => {
    let nodeId = threadDict[thread][storeOb.parent];
    let storeName = storeOb.name;
    if (nodeId == null) {
      throw new Error(
        `Error occurred while adding observer to node [${node.getId()}], parent thread node [${
          storeOb.parent
        }] does not exist.`
      );
    }
    let storeDict = fillAndGetStoreDict(careDict, nodeId);
    let keyCare = storeDict[storeName];
    if (keyCare == null) {
      storeDict[storeName] = Object.assign({}, storeOb.store, {
        rename: storeOb.rename
      });
    } else {
      throw new Error(
        `Error occurred while adding observer to store [${storeName}] of node [${nodeId}], you can not observe store duplicately.`
      );
    }
  });
  care.names.forEach(storeOb => {
    let nodeName = storeOb.nodeName;
    let storeName = storeOb.name;
    console.log(nameDict,storeName)
    let nodeId = nameDict[nodeName].ids[0];
    if (nodeId == null) {
      throw new Error(
        `Error occurred while adding observer to node [${nodeId}], parent node with name [${nodeName}] does not exist.`
      );
    }
    let storeDict = fillAndGetStoreDict(careDict, nodeId);
    let keyCare = storeDict[storeName];
    if (keyCare == null) {
      storeDict[storeName] = Object.assign({}, storeOb.store, {
        rename: storeOb.rename
      });
    } else {
      throw new Error(
        `Error occurred while adding observer to store [${storeName}] of node [${nodeId}], you can not observe store duplicately.`
      );
    }
  });
  return careDict;
}
