import { TransItem } from "./types";
import { genId } from "./utils";
import Transaction from "./Transaction";
import TransactionStatus from "../api/TransactionStatus";

export default class TransManager {
  transDict: Record<string, TransItem>;

  constructor() {
    this.transDict = {};
  }

  startTrans(): Transaction {
    let tranId;
    while (tranId == null) {
      tranId = genId();
      if (this.transDict[tranId] != null) {
        tranId = null;
      }
    }
    let transItem: TransItem = {
      id: tranId,
      isDone: false,
      isCanceled: false,
      observers: []
    };
    this.transDict[tranId] = transItem;
    return new Transaction(transItem, this);
  }

  cancelTans(transId: string) {
    let transItem = this.transDict[transId];
    if (transItem != null) {
      transItem.isCanceled = true;
      delete this.transDict[transId];
      transItem.observers.forEach(observer =>
        observer(TransactionStatus.CANCELED)
      );
    }
    return transItem;
  }

  doneTrans(transId: string) {
    let transItem = this.transDict[transId];
    if (transItem != null) {
      transItem.isDone = true;
      delete this.transDict[transId];
      transItem.observers.forEach(observer => observer(TransactionStatus.DONE));
    }
    return transItem;
  }
}
