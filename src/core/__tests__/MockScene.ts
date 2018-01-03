import { observable, action } from "src";

export default class MockScene {
  @observable observable = "test";

  @action
  action() {}

  @action.async
  async asyncAction(num: number) {}
}
