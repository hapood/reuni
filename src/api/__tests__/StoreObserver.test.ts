import { storeObserver } from "src";

it("tests StoreObserver", () => {
  let observer = storeObserver(({ storeInclude, storeExclude, store3 }) => {
    storeInclude.includes(["keyInclude"]);
    storeExclude.excludes(["keyExclude"]);
  })
    .byName("parent", ({ parentStore }) => {})
    .byThread(-2, ({ threadStore }) => {});
});
