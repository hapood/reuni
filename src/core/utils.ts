import SceneTree from "./SceneTree";
import { StateTreeDict } from "./types";

export function buildStateTreeDict(): StateTreeDict {
  return {};
}

export function genId() {
  return (
    "_" +
    Math.random()
      .toString(36)
      .substr(2, 9)
  );
}
