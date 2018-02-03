import { TaskItem } from "./types";
import { genId } from "./utils";
import TaskHandler from "../api/TaskHandler";
import TaskStatus from "../api/TaskStatus";

export default class TaskManager {
  taskDict: Record<string, TaskItem>;

  constructor() {
    this.taskDict = {};
  }

  startTask(parentTask?: TaskHandler | null | undefined): TaskHandler {
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
      observers: [],
      parentId: parentTask != null ? parentTask.getId() : null
    };
    this.taskDict[tranId] = taskItem;
    return new TaskHandler(taskItem, this);
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
