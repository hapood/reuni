import { observable, task } from "src";

export default class MockScene {
  @observable observable = "test";

  @task
  task() {}

  @task.async
  async asyncTask(num: number) {}
}
