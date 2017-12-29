import { SceneObserver } from "./types";

export default class SceneTree<S> {
  id: string;
  name: string;
  children: Record<string, SceneTree<any>>;
  state: S;
  observers: {
    keyList: string[];
    cb: () => void;
  }[];

  constructor(id: string, name: string, state: S) {
    this.id = id;
    this.name = name;
    this.state = state;
    this.children = {};
    this.observers = [];
  }

  getState() {
    return this.state;
  }

  replaceState(state: S) {
    this.state = state;
    this.notifyAll();
  }

  setState(pState: Partial<S>) {
    this.state = Object.assign({}, this.state, pState);
    this.notify(Object.keys(pState));
  }

  subscribe(path: string[], keyList: string[], cb: SceneObserver): () => void {
    if (path.length === 0) {
      throw new Error(
        `Error occurred when adding subscriber in scene [${
          this.id
        }], child path can not be []`
      );
    } else if (path.length === 1) {
      let observer = { keyList, cb };
      this.observers.push(observer);
      return () => {
        this.observers = this.observers.filter(item => item !== observer);
      };
    } else {
      let child = this.children[path[0]];
      if (child == null) {
        throw new Error(
          `Error occurred when adding child in scene [${
            this.id
          }], can not find [${path[0]}] in children`
        );
      }
      return child.subscribe(path.slice(1), keyList, cb);
    }
  }

  notifyAll() {
    this.observers.forEach(item => {
      item.cb();
    });
  }

  notify(keyList: string[]) {
    this.observers.forEach(item => {
      for (let i = 0; i < keyList.length; i++) {
        if (item.keyList.includes(keyList[i])) {
          item.cb();
        }
      }
    });
  }

  addChild(path: string[], scene: SceneTree<any>) {
    if (path.length === 0) {
      throw new Error(
        `Error occurred when adding child in scene [${
          this.id
        }], child path can not be []`
      );
    } else if (path.length === 1) {
      this.children[path[0]] = scene;
    } else {
      let child = this.children[path[0]];
      if (child == null) {
        throw new Error(
          `Error occurred when adding child in scene [${
            this.id
          }], can not find [${path[0]}] in children`
        );
      }
      child.addChild(path.slice(1), scene);
    }
  }
}
