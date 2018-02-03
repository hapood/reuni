import Store from "./Store";
import TaskHandler, { tKey } from "../api/TaskHandler";
import Reuni from "./Reuni";
import { preIgnite } from "./utils";

export default function spawnTask<F extends (...args: any[]) => any>(
  taskFunc: F
): F {
  let [taskName, store, t]: [string, Store, TaskHandler] = (taskFunc as any)[
    tKey
  ];
  let reuni = store.getNode().getReuni();
  let taskManager = reuni.getTaskManager();
  return preIgnite(store, taskName, t);
}
