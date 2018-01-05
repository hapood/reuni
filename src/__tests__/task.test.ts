import { createReuni, getTaskDescriptor } from "src";
import MixedStore from "./MixedStore";
import MonoStore from "./MonoStore";

it("Store works with cancel", done => {
  let arenaSotre = createReuni();
  let node1 = arenaSotre.mountNode(null, "node1");
  let monoStore = node1.addStore("monoStore", MonoStore) as string;
  let mixedStore = node1.addStore("mixedStore", MixedStore) as string;
  node1.subscribe(
    {
      $: {
        [monoStore]: ["cnt"]
      }
    },
    (isValid: boolean) => {
      let store: MonoStore = node1.findStore(monoStore);
      expect(store.cnt).toBe(2);
      done();
    }
  );
  let store: MixedStore = node1.findStore(mixedStore);
  let t = store.callOtherStore();
});
