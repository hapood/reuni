import { createReuni, Node, getTaskDescriptor, ObserveType } from "src";
import MonoStore from "./MonoStore";

it("Store works with observe", done => {
  let arenaSotre = createReuni();
  let node1 = arenaSotre.mountNode(null, "node1");
  let storeName = node1.addStore("monoStore", MonoStore) as string;
  let cbId = 0;
  node1.observe(
    {
      $: {
        [storeName]: { observeType: ObserveType.INCLUDE, keys: ["cnt"] }
      }
    },
    (isValid: boolean) => {
      let store: MonoStore =
        isValid == true ? node1.findStore(storeName) : null;
      switch (cbId) {
        case 0:
          expect(store.cnt).toBe(10);
          cbId++;
          break;
        case 1:
          expect(store.cnt).toBe(30);
          cbId++;
          break;
        case 2:
          expect(isValid).toBe(false);
          done();
      }
    }
  );
  let store: MonoStore = node1.findStore(storeName);
  let t = store.task();
  t.then(() => node1.deleteStore(storeName));
});

it("Store works with cancel", done => {
  let arenaSotre = createReuni();
  let node1 = arenaSotre.mountNode(null, "node1");
  let storeName = node1.addStore("MonoStore", MonoStore) as string;
  node1.observe(
    {
      $: {
        [storeName]: { observeType: ObserveType.INCLUDE, keys: ["cnt"] }
      }
    },
    (isValid: boolean) => {
      let store: MonoStore = node1.findStore(storeName);
      expect(store.cnt).toBe(2);
      done();
    }
  );
  let store: MonoStore = node1.findStore(storeName);
  let t = store.cancelable();
  let task = getTaskDescriptor(t).cancel();
  store.addAsync(2);
});
