import { StoreObserver, ObserverCareDict, DirtyNodes } from "./types";
import ObManager from "./ObManager";
import Reuni from "./Reuni";
import { ObserverCB } from "../api/types";
import { buildEntityDict, isCareStoreDirty, isCareStoreValid } from "./utils";

export default class NodeObManager extends ObManager<StoreObserver> {
  addStoreRefresh(nodeId: string, storeName: string, reuni: Reuni) {
    let tmpBeValidObs = this._addStoreValidFilter(nodeId, storeName, reuni);
    let beValidObs = tmpBeValidObs;
    if (tmpBeValidObs != null) {
      tmpBeValidObs.every(ob => {
        ob.cb(true, buildEntityDict(ob.care, reuni));
        let childBeValidStores: StoreObserver[] = [];
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
        let childBeInvalidStores: StoreObserver[] = [];
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
    storeName: string,
    cb: ObserverCB,
    reuni: Reuni
  ) {
    let curObserver: StoreObserver = { nodeId, storeName, care, cb };
    let isCB = isCareStoreValid(care, reuni.getStoreValidDict());
    if (isCB !== false) {
      this._observers.push(curObserver);
      cb(true, buildEntityDict(care, reuni));
    } else {
      this._invalidObs.push(curObserver);
    }
    return curObserver;
  }
}
