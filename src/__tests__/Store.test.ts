import { createReuni, Node, getTaskDescriptor, storeObserver } from "src";
import MonoStore from "./MonoStore";

it("Store works with observe", done => {
  let thread = Symbol("thread");
  let reuni = createReuni();
  let node1 = reuni.mountNode({ thread });
  node1.addStore("monoStore", MonoStore);
  let cbId = 0;
  node1.observe(
    storeObserver(({ monoStore }) => {
      monoStore.includes(["cnt"]);
    }),
    (isValid: boolean, entityDict: any) => {
      let store: MonoStore = null as any;
      if (isValid !== false) {
        store = entityDict.monoStore;
      }
      switch (cbId) {
        case 0:
          cbId++;
          expect(isValid).toBe(true);
          expect(store.cnt).toBe(0);
          store.task().then(() => node1.deleteStore("monoStore"));
          break;
        case 1:
          cbId++;
          expect(isValid).toBe(true);
          expect(store.cnt).toBe(10);
          break;

        case 2:
          cbId++;
          expect(isValid).toBe(true);
          expect(store.cnt).toBe(30);
          break;
        case 3:
          expect(isValid).toBe(false);
          done();
          break;
      }
    }
  );
});

it("Store works with cancel", done => {
  let thread = Symbol("thread");
  let reuni = createReuni();
  let node1 = reuni.mountNode({ thread });
  let cbId = 0;
  node1.addStore("monoStore", MonoStore);
  node1.observe(
    storeObserver(({ monoStore }) => {}),
    (isValid: boolean, entityDict: any) => {
      let store: MonoStore = entityDict.monoStore;
      switch (cbId) {
        case 0:
          cbId++;
          expect(isValid).toBe(true);
          expect(store.cnt).toBe(0);
          let t = store.cancelable();
          getTaskDescriptor(t).cancel();
          store.addAsync(2);
          break;
        case 1:
          cbId++;
          expect(isValid).toBe(true);
          expect(store.cnt).toBe(2);
          done();
          break;
      }
    }
  );
});
