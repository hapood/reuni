import { createReuni, getTaskDescriptor, storeObserver } from "src";
import MixedStore from "./MixedStore";
import MonoStore from "./MonoStore";

it("Cross store task works sync", done => {
  let thread = Symbol("thread");
  let reuni = createReuni();
  let node1 = reuni.mountNode({ thread });
  node1.addStore(
    "mixedStore",
    MixedStore,
    storeObserver(({ monoStore }) => ({ monoStore }))
  );
  node1.addStore("monoStore", MonoStore);
  let cbId = 0;
  node1.observe(
    storeObserver(({ mixedStore }) => ({ mixedStore })),
    (isValid: boolean, entityDict: any) => {
      let mixedStore!: MixedStore;
      if (isValid !== false) {
        mixedStore = entityDict.mixedStore;
      }
      switch (cbId) {
        case 0:
          cbId++;
          expect(isValid).toBe(true);
          expect(mixedStore.monoStore.cnt).toBe(0);
          mixedStore.callOtherStore();
          break;
        case 1:
          cbId++;
          expect(isValid).toBe(true);
          expect(mixedStore.monoStore.cnt).toBe(2);
          done();
          break;
      }
    }
  );
});

it("Cross store async task works", done => {
  let thread = Symbol("thread");
  let reuni = createReuni();
  let node1 = reuni.mountNode({ thread });
  node1.addStore("monoStore", MonoStore);
  node1.addStore(
    "mixedStore",
    MixedStore,
    storeObserver(({ monoStore }) => ({ monoStore }))
  );
  let cbId = 0;
  node1.observe(
    storeObserver(({ mixedStore }) => ({ mixedStore })),
    (isValid: boolean, entityDict: any) => {
      let mixedStore: MixedStore = null as any;
      if (isValid !== false) {
        mixedStore = entityDict.mixedStore;
      }
      switch (cbId) {
        case 0:
          cbId++;
          expect(isValid).toBe(true);
          expect(mixedStore.monoStore.cnt).toBe(0);
          mixedStore
            .callOtherStoreAsync()
            .then(() => node1.deleteStore("monoStore"));
          break;
        case 1:
          cbId++;
          expect(isValid).toBe(true);
          expect(mixedStore.monoStore.cnt).toBe(0);
          break;
        case 2:
          cbId++;
          expect(isValid).toBe(true);
          expect(mixedStore.monoStore.cnt).toBe(4);
          break;
        case 3:
          cbId++;
          expect(isValid).toBe(false);
          done();
          break;
      }
    }
  );
});
