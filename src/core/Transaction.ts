import TransManager from "./TransManager";
import { TransItem } from "./types";

export default class Transaction {
  private transItem: TransItem;
  private transManager: TransManager;
  private cbs: (() => void)[];

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
    if (this.transItem.isCanceled === false) {
      this.transItem.isCanceled = true;
    }
  }
}
