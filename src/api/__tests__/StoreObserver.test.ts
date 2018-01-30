import { storeObserver, createReuni, value, store, NodeAPI } from "src";

class MockStore {
  @value keyInclude = "";
  @value keyExclude = "";
  @store store: MockStore;
}

it("tests StoreObserver", () => {
  let observer = storeObserver(({ storeInclude, storeExclude, store }) => {
    storeInclude.includes(["keyInclude"]).rename("storeI");
    storeExclude.excludes(["keyExclude"]);
  })
    .byName("parent", ({ parentStore }) => {
      parentStore.rename("father");
    })
    .byThread(({ threadStore }) => {});
  let reuni = createReuni();
  let thread = Symbol("thread1");
  let node1 = reuni.mountNode({ thread, name: "parent" });
  node1.addStore("parentStore", MockStore).addStore("threadStore", MockStore);
  let node1_1 = reuni.mountNode({ thread, parentId: node1.getId() });
  node1_1
    .addStore("storeInclude", MockStore)
    .addStore("storeExclude", MockStore)
    .addStore("store", MockStore);
  node1_1.observe(observer, () => null);
  expect(node1_1).toBeInstanceOf(NodeAPI);
});
