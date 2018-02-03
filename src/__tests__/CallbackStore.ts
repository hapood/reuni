import { task, value, spawnTask } from "src";
import MonoStore from "./MonoStore";

export default class CallbackStore {
  @value cnt: number = 0;

  @task
  addAsync(num: number) {
    setTimeout(() => {
      spawnTask(this.callback)(num);
    }, 10);
  }

  @task
  callback(num: number) {
    this.cnt += num;
  }
}
