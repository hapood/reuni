import TransManager from "./TransManager";
import { TransItem } from "./types";
import TransactionStatus from "../api/TransactionStatus";

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
    let observers = this.transItem.observers;
    observers.push(cb);
    return () => {
      this.transItem.observers = observers.filter(observer => observer !== cb);
    };
  }
}
