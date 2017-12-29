export default class SceneTree<S> {
  id: string;
  children: Record<string, SceneTree<any>>;
  state: S;
  observers: { keyList: string[]; cb: () => void }[];

  constructor(id: string, state: S) {
    this.id = id;
    this.state = state;
    this.children = {};
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

  subscribe(keyList: string[], cb: () => void) {
    let observer = { keyList, cb };
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(item => item !== observer);
    };
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

  addChild(path: symbol[], treeNode: SceneTree<any>) {
    if (path.length === 1) {
      this.children[path[0]] = treeNode;
    } else {
      let child = this.children[path[0]];
      if (child == null) {
        throw new Error(
          `Error occurred when adding child node in node [${
            this.id
          }], can not find child node [${path[0]}]`
        );
      }
      child.addChild(path.slice(1), child);
    }
  }
}
