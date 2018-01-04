import { observable, task, scene } from "src";
import MonoScene from "./MonoScene";

export default class MixedScene {
  @scene("monoScene") monoScene: MonoScene;

  @task
  callOtherScene() {
    this.monoScene.add(2);
  }
}
