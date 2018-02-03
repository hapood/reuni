import { Observer, StoreObserver, StoreValidDict, DirtyNodes } from "./types";
import ObserveType from "../api/ObserveType";
import Reuni from "./Reuni";
import {
  isStoreCare,
  isCareNode,
  isCareStoreValid,
  storeObserveMatch,
  buildEntityDict
} from "./utils";

export default class NodeObManager<O extends Observer> {
  protected _invalidObs: O[] = [];
  protected _observers: O[] = [];

  _addStoreValidFilter(nodeId: string, storeName: string, reuni: Reuni) {
    let beValidObs: O[] = [];
    if (this._invalidObs.length === 0) return beValidObs;
    let newInvalidObs: O[] = [];
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
    let beInvalidObs: O[] = [];
    if (this._observers.length === 0) return beInvalidObs;
    let newValidObs: O[] = [];
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

  unobserve(observer: O) {
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
