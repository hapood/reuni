import { ScenePropertyRegister } from "./types";

export default class Scene {
  register: ScenePropertyRegister;
  constructor(register: ScenePropertyRegister) {
    this.register = register;
  }
}
