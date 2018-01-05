import { createReuni, Reuni, Node, NodeAPI } from "src";
import MockStore from "./MockStore";

it("tests createReuni", () => {
  let arenaSotre = createReuni();
  expect(arenaSotre).toBeInstanceOf(Reuni);
});

it("tests ArenaSotre mount/unmount node", () => {
  let arenaSotre = createReuni();
  let node1 = arenaSotre.mountNode(null, "node1");
  expect(arenaSotre).toBeInstanceOf(Reuni);
  let node1Child1 = node1.mountChild(null, "node1Child");
  expect(node1Child1).toBeInstanceOf(NodeAPI);
  let node1Child2 = node1.mountChild("node1ChildKey", "node1Child") as NodeAPI;
  expect(node1Child2).toBeInstanceOf(NodeAPI);
  let node1Child3 = node1.mountChild(null, "node1Child") as NodeAPI;
  node1Child2.destroy();
  expect(node1Child2.isDestroy()).toBe(true);
  node1.unmountChild(node1Child3.getId() as string);
  node1.destroy();
  let keys = Object.keys(arenaSotre.getNodeDict());
  expect(node1.mountChild(null, "empty")).toBeNull();
  expect(keys.length).toBe(1);
});

it("tests ArenaSotre add/delete Store", () => {
  let arenaSotre = createReuni();
  let node1 = arenaSotre.mountNode(null, "node1");
  let storeName1 = node1.addStore("store1", MockStore) as string;
  let storeName2 = node1.addStore("store2", MockStore) as string;
  expect(storeName1).toBe("store1");
  node1.deleteStore(storeName1);
  let keys = Object.keys(
    (arenaSotre.getNode(node1.getId()) as Node).getStores()
  );
  expect(keys.length).toBe(1);
  node1.destroy();
  expect(node1.findStore(storeName2)).toBeNull;
});
