import { observable, action } from "src";

export default class MockScene {
  @observable name = "test";
  @observable cnt = 0;

  @action
  add(num: number) {
    this.cnt += num;
  }

  @action
  reset() {
    this.cnt = 0;
  }

  @action.async
  async addAsync(num: number) {
    return new Promise(resolve => {
      setTimeout(() => {
        this.cnt += num;
        resolve();
      }, 100);
    });
  }

  @action.async
  async transaction() {
    this.add(10);
    await this.addAsync(5);
    this.cnt *= 2;
  }
}
