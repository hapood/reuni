import { storeObserver, createReuni, value } from "src";

class MockStore {
  @value keyInclude = "";
  @value keyExclude = "";
}

it("tests StoreObserver", () => {
  let observer = storeObserver(({ storeInclude, storeExclude, store }) => {
    storeInclude.includes(["keyInclude"]).rename("storeI");
    storeExclude.excludes(["keyExclude"]);
  })
    .byName("parent", ({ parentStore }) => {
      parentStore.rename("father");
    })
    .byThread(1, ({ threadStore }) => {});
  let arenaSotre = createReuni();
  let thread = Symbol("thread1");
  let node1 = arenaSotre.mountNode({ thread, name: "parent" });
  node1.addStore("parentStore", MockStore).addStore("parentStore", MockStore);
  let node2 = arenaSotre.mountNode({ thread });
});
