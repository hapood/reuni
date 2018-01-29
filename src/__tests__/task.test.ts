import { createReuni, getTaskDescriptor, storeObserver } from "src";
import MixedStore from "./MixedStore";
import MonoStore from "./MonoStore";

it("Store works with cancel", done => {
  let thread = Symbol("thread");
  let arenaSotre = createReuni();
  let node1 = arenaSotre.mountNode({ thread });
  node1.addStore("monoStore", MonoStore);
  node1.addStore(
    "mixedStore",
    MixedStore,
    storeObserver(({ monoStore }) => {})
  );
  let cbId = 0;
  node1.observe(
    storeObserver(({ mixedStore, monoStore }) => {}),
    (isValid: boolean, entityDict: any) => {
      expect(entityDict.monoStore.cnt).toBe(2);
      done();
      switch (cbId) {
        case 0:
          cbId++;
          expect(isValid).toBe(true);
          expect(entityDict.monoStore.cnt).toBe(0);
          entityDict.monoStore.callOtherStore();
          entityDict.mixedStore
            .task()
            .then(() => node1.deleteStore("monoStore"));
          break;
        case 1:
          cbId++;
          expect(isValid).toBe(true);
          expect(entityDict.monoStore.cnt).toBe(10);
          done();
          break;
      }
    }
  );
});
