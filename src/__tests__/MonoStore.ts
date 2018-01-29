import { value, task, delay } from "src";

export default class MonoStore {
  @value name = "test";
  @value cnt = 0;

  @task
  add(num: number) {
    this.cnt += num;
  }

  @task
  reset() {
    this.cnt = 0;
  }

  @task.async
  async addAsync(num: number) {
    await delay(100);
    console.log("addAsync")
    this.cnt += num;
  }

  @task.async
  async task() {
    this.add(10);
    console.log("add 10")
    await this.addAsync(5);
    this.cnt *= 2;
  }

  @task.async
  async cancelable() {
    await delay(0);
    console.log("cancelable")
    this.cnt += 1;
  }
}
