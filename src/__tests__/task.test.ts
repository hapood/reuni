import { createReuni, getTaskDescriptor, storeObserver } from "src";
import MixedStore from "./MixedStore";
import MonoStore from "./MonoStore";

it("Task works with cancel", done => {
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
    storeObserver(({ mixedStore }) => {}),
    (isValid: boolean, entityDict: any) => {
      let mixedStore: MixedStore = null as any;
      if (isValid !== false) {
        mixedStore = entityDict.mixedStore;
      }
      done();
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
