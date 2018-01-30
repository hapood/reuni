import { value, task } from "src";

export default class MockStore {
  @value observable = "test";

  @task
  task() {}

  @task.async
  async asyncTask(num: number) {}
}
