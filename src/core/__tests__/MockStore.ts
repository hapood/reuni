import { observable, task } from "src";

export default class MockStore {
  @observable observable = "test";

  @task
  task() {}

  @task.async
  async asyncTask(num: number) {}
}
