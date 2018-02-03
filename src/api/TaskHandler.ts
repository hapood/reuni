import TaskManager from "../core/TaskManager";
import { TaskItem } from "../core/types";
import TaskStatus from "./TaskStatus";

export const tKey = Symbol("tid");

export default class TaskHandler {
  private taskItem: TaskItem;
  private taskManager: TaskManager;

  constructor(taskItem: TaskItem, taskManager: TaskManager) {
    this.taskItem = taskItem;
    this.taskManager = taskManager;
  }

  isDone() {
    return this.taskItem.isDone;
  }

  getId() {
    return this.taskItem.id;
  }

  isCanceled() {
    return this.taskItem.isCanceled;
  }

  cancel() {
    if (this.taskItem.isCanceled !== true) {
      this.taskManager.cancelTans(this.taskItem.id);
    }
  }

  observe(cb: (tStatus: TaskStatus) => void) {
    if (this.taskItem.isCanceled !== true && this.taskItem.isDone !== true) {
      let observers = this.taskItem.observers;
      observers.push(cb);
      return {};
    }
    return null;
  }
}
