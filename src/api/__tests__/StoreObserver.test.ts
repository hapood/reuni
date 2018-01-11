import { StoreObserver } from "src";

it("tests StoreObserver", () => {
  let storeObserver = new StoreObserver(
    ({ storeInclude, storeExclude, store3 }) => {
      storeInclude.includes(["keyInclude"]);
      storeExclude.excludes(["keyExclude"]);
    }
  )
    .byName("parent", ({ parentStore }) => {
      parentStore.includes(["key"]);
    })
    .byThread(-2, ({ threadStore }) => {
      threadStore.excludes(["key"]).inject();
    });
});
