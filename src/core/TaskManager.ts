import { TaskItem } from "./types";
import { genId } from "./utils";
import Task from "../api/TaskDescriptor";
import TaskStatus from "../api/TaskStatus";

export default class TaskManager {
  taskDict: Record<string, TaskItem>;

  constructor() {
    this.taskDict = {};
  }

  startTask(): Task {
    let tranId;
    while (tranId == null) {
      tranId = genId();
      if (this.taskDict[tranId] != null) {
        tranId = null;
      }
    }
    let taskItem: TaskItem = {
      id: tranId,
      isDone: false,
      isCanceled: false,
      observers: []
    };
    this.taskDict[tranId] = taskItem;
    return new Task(taskItem, this);
  }

  cancelTans(transId: string) {
    let taskItem = this.taskDict[transId];
    if (taskItem != null) {
      taskItem.isCanceled = true;
      delete this.taskDict[transId];
      taskItem.observers.forEach(observer => observer(TaskStatus.CANCELED));
    }
    return taskItem;
  }

  finishTask(transId: string) {
    let taskItem = this.taskDict[transId];
    if (taskItem != null) {
      taskItem.isDone = true;
      delete this.taskDict[transId];
      taskItem.observers.forEach(observer => observer(TaskStatus.DONE));
    }
    return taskItem;
  }
}
