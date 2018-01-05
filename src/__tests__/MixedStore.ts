import { observable, task, store } from "src";
import MonoStore from "./MonoStore";

export default class MixedStore {
  @store("monoStore") monoStore: MonoStore;

  @task
  callOtherStore() {
    this.monoStore.add(2);
  }
}
