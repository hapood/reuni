import Node from "./Node";
import { SceneDict } from "./types";

export function buildStateTreeDict(): SceneDict {
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
