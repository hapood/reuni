import { task, store } from "src";
import MonoStore from "./MonoStore";

export default class MixedStore {
  @store monoStore: MonoStore;

  @task
  callOtherStore() {
    this.monoStore.add(2);
  }

  @task.async
  async callOtherStoreAsync() {
    await this.monoStore.addAsync(4);
  }
}
