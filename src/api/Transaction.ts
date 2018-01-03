import TransManager from "../core/TransManager";
import { TransItem } from "../core/types";
import TransactionStatus from "./TransactionStatus";

export const tKey = Symbol("tid");

export const asKey = Symbol("arenaStore");

export default class Transaction {
  private transItem: TransItem;
  private transManager: TransManager;

  constructor(transItem: TransItem, transManager: TransManager) {
    this.transItem = transItem;
    this.transManager = transManager;
  }

  isDone() {
    return this.transItem.isDone;
  }

  getId() {
    return this.transItem.id;
  }

  isCanceled() {
    return this.transItem.isCanceled;
  }

  cancel() {
    if (this.transItem.isCanceled !== true) {
      this.transManager.cancelTans(this.transItem.id);
    }
  }

  subscribe(cb: (tStatus: TransactionStatus) => void) {
    if (this.transItem.isCanceled !== true && this.transItem.isDone !== true) {
      let observers = this.transItem.observers;
      observers.push(cb);
      return {};
    }
    return null;
  }
}
