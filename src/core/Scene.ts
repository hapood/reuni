import { SceneObserver, RawScene } from "./types";
import Node from "./Node";

export default class Scene<S, A> {
  name: string;
  state: S;
  nextState: S;
  observer: SceneObserver;

  constructor(scene: RawScene<S, A>, observer: SceneObserver) {
    this.name = scene.name;
    this.state = scene.state;
    this.nextState = Object.assign({}, scene.state);
    this.observer = observer;
  }

  getState() {
    return this.state;
  }

  replaceState(state: S) {
    this.nextState = state;
  }

  setState(pState: Partial<S>) {
    Object.assign(this.nextState, pState);
  }

  commit() {
    let oldKeys = Object.keys(this.state);
    let newKeys = Object.keys(this.nextState);
    let dirtyKeys = {};
    oldKeys.concat(newKeys).forEach(key => {
      if(this.state[key]!==this.nextState[key]){
        
      }
    });
  }
}
