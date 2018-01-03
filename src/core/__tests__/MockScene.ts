import { observable, task } from "src";

export default class MockScene {
  @observable observable = "test";

  @task
  action() {}

  @task.async
  async asyncAction(num: number) {}
}
