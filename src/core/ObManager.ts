import {
  ObserverCareDict,
  Observer,
  StoreValidDict,
  KeyCareItem,
  DirtyNodes
} from "./types";
import ObserveType from "../api/ObserveType";
import { ObserverCB } from "../api/types";
import Reuni from "./Reuni";

function isStoreCare(
  care: ObserverCareDict,
  nodeId: string,
  storeName: string
) {
  let careNodeIdList = Object.keys(care);
  let isCare = false;
  for (let i = 0; i < careNodeIdList.length; i++) {
    let careNodeId = careNodeIdList[i];
    if (careNodeId === nodeId) {
      let careStoreNameList = Object.keys(care[careNodeId]);
      for (let j = 0; j < careStoreNameList.length; j++) {
        if (storeName === careStoreNameList[j]) {
          isCare = true;
          break;
        }
      }
      break;
    }
  }
  return isCare;
}

function isCareNode(care: ObserverCareDict, nodeId: string) {
  let careNodeIdList = Object.keys(care);
  let isCare = false;
  for (let i = 0; i < careNodeIdList.length; i++) {
    let careNodeId = careNodeIdList[i];
    if (careNodeId === nodeId) {
      isCare = true;
      break;
    }
  }
  return isCare;
}

function isCareStoreValid(
  care: ObserverCareDict,
  storeValidDict: StoreValidDict
) {
  let isCb = true;
  let careNodeIdList = Object.keys(care);
  for (let i = 0; i < careNodeIdList.length; i++) {
    let nodeId = careNodeIdList[i];
    let storeValid = storeValidDict[nodeId];
    let storeCareDict = care[nodeId];
    let storeNames = Object.keys(storeCareDict);
    for (let i = 0; i < storeNames.length; i++) {
      let storeObj = storeValid[storeNames[i]];
      if (storeObj == null || storeObj.isValid() !== true) {
        isCb = false;
        break;
      }
    }
  }
  return isCb;
}

function storeObserveMatch(
  dirtyKeys: Record<string, boolean>,
  keyObserve: KeyCareItem
) {
  switch (keyObserve.type) {
    case ObserveType.ALL:
      return true;
    case ObserveType.INCLUDE:
      return storeObserveInclude(dirtyKeys, keyObserve.keys);
    case ObserveType.EXCLUDE:
      return storeObserveInclude(dirtyKeys, keyObserve.keys);
    default:
      return false;
  }
}

function storeObserveInclude(
  dirtyKeys: Record<string, boolean>,
  keys: string[]
) {
  for (let k = 0; k < keys.length; k++) {
    let key = keys[k];
    if (dirtyKeys[key] != null) {
      return true;
    }
  }
  return false;
}

function isCareStoreDirty(
  care: ObserverCareDict,
  dirtyNodes: Record<string, Record<string, Record<string, boolean>>>
) {
  let isCb = false;
  let careNodeIdList = Object.keys(care);
  for (let i = 0; i < careNodeIdList.length; i++) {
    let nodeId = careNodeIdList[i];
    let dirtyStores = dirtyNodes[nodeId];
    if (dirtyStores != null) {
      let storeObserve = care[nodeId];
      let careStoreNameList = Object.keys(storeObserve);
      for (let j = 0; j < careStoreNameList.length; j++) {
        let storeName = careStoreNameList[j];
        let dirtyKeys = dirtyStores[storeName];
        if (dirtyKeys != null) {
          let keyObserve = storeObserve[storeName];
          isCb = storeObserveMatch(dirtyKeys, keyObserve);
          if (isCb !== false) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function buildEntityDict(careDict: ObserverCareDict, reuni: Reuni) {
  let dict: any = {};
  Object.entries(careDict).forEach(([nodeId, storeCareDict]) => {
    Object.entries(storeCareDict).map(([storeName, careItem]) => {
      dict[careItem.rename || storeName] = reuni.getEntity(nodeId, storeName);
    });
  });
  return dict;
}

export default class ObManager {
  private _invalidObs: Observer[] = [];
  private _observers: Observer[] = [];

  _addStoreValidFilter(nodeId: string, storeName: string, reuni: Reuni) {
    let beValidObs: Observer[] = [];
    if (this._invalidObs.length === 0) return beValidObs;
    let newInvalidObs: Observer[] = [];
    let tmpObs = this._invalidObs.filter(ob => {
      let isCare = isStoreCare(ob.care, nodeId, storeName);
      if (isCare !== false) {
        let isValid = isCareStoreValid(ob.care, reuni.getStoreValidDict());
        if (isValid !== false) {
          beValidObs.push(ob);
        }
        return isValid;
      } else {
        newInvalidObs.push(ob);
        return false;
      }
    });
    if (beValidObs.length !== 0) {
      this._invalidObs = newInvalidObs;
      this._observers = this._observers.concat(beValidObs);
    }
    return beValidObs;
  }

  _deleteStoreValidFilter(nodeId: string, storeName: string, reuni: Reuni) {
    let beInvalidObs: Observer[] = [];
    if (this._observers.length === 0) return beInvalidObs;
    let newValidObs: Observer[] = [];
    let tmpObs = this._observers.filter(ob => {
      let isCare = isStoreCare(ob.care, nodeId, storeName);
      if (isCare !== false) {
        beInvalidObs.push(ob);
        return true;
      } else {
        newValidObs.push(ob);
        return false;
      }
    });
    if (beInvalidObs.length !== 0) {
      this._invalidObs = this._invalidObs.concat(beInvalidObs);
      this._observers = newValidObs;
    }
    return beInvalidObs;
  }

  addStoreRefresh(nodeId: string, storeName: string, reuni: Reuni) {
    let tmpBeValidObs = this._addStoreValidFilter(nodeId, storeName, reuni);
    let beValidObs = tmpBeValidObs;
    if (tmpBeValidObs != null) {
      tmpBeValidObs.every(ob => {
        ob.cb(true, buildEntityDict(ob.care, reuni));
        let childBeValidStores: Observer[] = [];
        if (ob.storeName != null) {
          childBeValidStores = this.addStoreRefresh(
            ob.nodeId,
            ob.storeName,
            reuni
          );
        }
        if (childBeValidStores.length !== 0) {
          beValidObs = beValidObs.concat(childBeValidStores);
        }
        return this._invalidObs.length !== 0;
      });
    }
    return beValidObs;
  }

  enableStoreNotify(nodeId: string, storeName: string, reuni: Reuni) {
    let beValidObs = this._addStoreValidFilter(nodeId, storeName, reuni);
    beValidObs.forEach(ob => {
      ob.cb(true, buildEntityDict(ob.care, reuni));
    });
  }

  deleteStoreRefresh(nodeId: string, storeName: string, reuni: Reuni) {
    let tmpBeInvalidObs = this._deleteStoreValidFilter(
      nodeId,
      storeName,
      reuni
    );
    let beInvalidObs = tmpBeInvalidObs == null ? [] : tmpBeInvalidObs;
    if (tmpBeInvalidObs != null) {
      tmpBeInvalidObs.every(ob => {
        ob.cb(false);
        let childBeInvalidStores: Observer[] = [];
        if (ob.storeName != null) {
          childBeInvalidStores = this.deleteStoreRefresh(
            ob.nodeId,
            ob.storeName,
            reuni
          );
        }
        if (childBeInvalidStores.length !== 0) {
          beInvalidObs = beInvalidObs.concat(childBeInvalidStores);
        }
        return this._observers.length !== 0;
      });
    }
    return beInvalidObs;
  }

  umountNodeNotify(nodeId: string) {
    this._observers = this._observers.filter(ob => {
      if (isCareNode(ob.care, nodeId) === true) {
        ob.cb(false);
        return false;
      } else {
        return true;
      }
    });
    this._invalidObs = this._invalidObs.filter(ob => {
      return isCareNode(ob.care, nodeId) === true;
    });
  }

  getObs() {
    return this._observers;
  }

  getInvalidObs() {
    return this._invalidObs;
  }

  disableStoreNotify(nodeId: string, storeName: string, reuni: Reuni) {
    let beInalidObs = this._deleteStoreValidFilter(nodeId, storeName, reuni);
    if (beInalidObs != null) {
      beInalidObs.forEach(ob => {
        let isCare = isStoreCare(ob.care, nodeId, storeName);
        if (isCare !== false) {
          ob.cb(false);
        }
      });
    }
  }

  dirtyNotify(dirtyNodes: DirtyNodes, reuni: Reuni) {
    this._observers.forEach(ob => {
      let isCb = isCareStoreDirty(ob.care, dirtyNodes);
      if (isCb !== false) {
        ob.cb(true, buildEntityDict(ob.care, reuni));
      }
    });
  }

  observe(
    care: ObserverCareDict,
    nodeId: string,
    storeName: string | null | undefined,
    cb: ObserverCB,
    reuni: Reuni
  ) {
    let curObserver: Observer = { nodeId, storeName, care, cb };
    let isCB = isCareStoreValid(care, reuni.getStoreValidDict());
    if (isCB !== false) {
      this._observers.push(curObserver);
      cb(true, buildEntityDict(care, reuni));
    } else {
      this._invalidObs.push(curObserver);
    }
    return curObserver;
  }

  unobserve(observer: Observer) {
    let isCleared = false as boolean;
    this._observers = this._observers.filter(ob => {
      if (observer === ob) {
        ob.cb(false);
        isCleared = true;
        return false;
      } else {
        return true;
      }
    });
    if (isCleared !== true) {
      this._invalidObs = this._invalidObs.filter(ob => {
        return observer !== ob;
      });
    }
  }
}
