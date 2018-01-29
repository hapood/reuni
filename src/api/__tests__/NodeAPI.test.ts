import { createReuni, Reuni, NodeAPI, storeObserver } from "src";
import MockStore from "./MockStore";

it("tests node destory", () => {
  let thread = Symbol("thread");
  let reuni = createReuni();
  let node1 = reuni.mountNode({ thread: thread });
  expect(node1.isDestroy()).toBe(false);
  node1.addStore("store1", MockStore);
  node1.destroy();
  expect(node1.isDestroy()).toBe(true);
});

it("tests node add/delete Store", () => {
  let thread = Symbol("thread");
  let reuni = createReuni();
  let node1 = reuni.mountNode({ thread: thread });
  node1.addStore("store1", MockStore);
  node1.addStore("store2", MockStore, storeObserver(({ store2 }) => {}));
  let keys = Object.keys(reuni.getNode(node1.getId()).getStores());
  expect(keys.length).toBe(2);
  node1.deleteStore("store2");
  keys = Object.keys(reuni.getNode(node1.getId()).getStores());
  expect(keys.length).toBe(1);
});
