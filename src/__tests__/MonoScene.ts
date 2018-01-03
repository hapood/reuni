import { observable, task } from "src";

export default class MockScene {
  @observable name = "test";
  @observable cnt = 0;

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
    return new Promise(resolve => {
      setTimeout(() => {
        this.cnt += num;
        resolve();
      }, 100);
    });
  }

  @task.async
  async task() {
    this.add(10);
    await this.addAsync(5);
    this.cnt *= 2;
  }

  @task.async
  async cancelable() {
    return new Promise(resolve => {
      setTimeout(() => {
        this.cnt += 1;
        resolve();
      }, 0);
    });
  }
}
