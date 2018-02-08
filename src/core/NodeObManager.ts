import { Observer, StoreObserver, DirtyNodes, ObserverCareDict } from "./types";
import { ObserverCB } from "../api/types";
import Reuni from "./Reuni";
import ObManager from "./ObManager";
import {
  buildEntityDict,
  isCareNode,
  isCareStoreDirty,
  isCareStoreValid
} from "./utils";

export default class NodeObManager extends ObManager<Observer> {
  enableStores(beValidObs: StoreObserver[], reuni: Reuni) {
    if (this._invalidObs.length !== 0) {
      beValidObs.every(ob => {
        this._addStoreValidFilter(ob.nodeId, ob.storeName, reuni).forEach(
          ob => {
            ob.cb(true, buildEntityDict(ob.care, reuni));
          }
        );
        return this._invalidObs.length !== 0;
      });
    }
  }

  disableStores(beInalidObs: StoreObserver[], reuni: Reuni) {
    if (this._observers.length !== 0) {
      beInalidObs.every(ob => {
        let beInalidObs = this._deleteStoreValidFilter(
          ob.nodeId,
          ob.storeName,
          reuni
        ).forEach(ob => {
          ob.cb(false);
        });
        return this._observers.length !== 0;
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
    cb: ObserverCB,
    reuni: Reuni
  ) {
    let curObserver: Observer = { nodeId, care, cb };
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
