import { storeObserver } from "src";

it("tests StoreObserver", () => {
  let observer = storeObserver(({ storeInclude, storeExclude, store }) => {
    storeInclude.includes(["keyInclude"]).rename("storeI");
    storeExclude.excludes(["keyExclude"]);
  })
    .byName("parent", ({ parentStore }) => {
      parentStore.rename("father");
    })
    .byThread(2, ({ threadStore }) => {});
});
