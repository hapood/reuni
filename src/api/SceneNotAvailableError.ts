import Scene from "../core/Scene";

export default class SceneNotExistError extends Error {
  constructor(scene: Scene) {
    super(`Scene [${scene.getName()}] is not available now.`);
    Object.setPrototypeOf(this, SceneNotExistError.prototype);
  }
}
