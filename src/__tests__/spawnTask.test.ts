import { createReuni, getTaskDescriptor, storeObserver } from "src";
import CallbackStore from "./CallbackStore";

it("Store works with spawn", done => {
  let thread = Symbol("thread");
  let reuni = createReuni();
  let node1 = reuni.mountNode({ thread });
  node1.addStore("callbackStore", CallbackStore);
  let cbId = 0;
  node1.observe(
    storeObserver(({ callbackStore }) => ({
      callbackStore: callbackStore.includes(["cnt"])
    })),
    (isValid: boolean, entityDict: any) => {
      let store!: CallbackStore;
      if (isValid !== false) {
        store = entityDict.callbackStore;
      }
      switch (cbId) {
        case 0:
          cbId++;
          expect(isValid).toBe(true);
          expect(store.cnt).toBe(0);
          store.addAsync(9);
          break;
        case 1:
          cbId++;
          expect(isValid).toBe(true);
          expect(store.cnt).toBe(9);
          done();
          break;
      }
    }
  );
});
