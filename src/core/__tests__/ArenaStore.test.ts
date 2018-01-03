import { createArena, ArenaStore, Node, NodeAPI } from "src";
import MockScene from "./MockScene";

it("tests createArena", () => {
  let arenaSotre = createArena();
  expect(arenaSotre).toBeInstanceOf(ArenaStore);
});

it("tests ArenaSotre mount/unmount node", () => {
  let arenaSotre = createArena();
  let node1 = arenaSotre.mountNode(null, "node1");
  expect(arenaSotre).toBeInstanceOf(ArenaStore);
  let node1Child1 = node1.mountChild(null, "node1Child") as NodeAPI;
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

it("tests ArenaSotre add/delete Scene", () => {
  let arenaSotre = createArena();
  let node1 = arenaSotre.mountNode(null, "node1");
  let sceneName1 = node1.addScene("scene1", MockScene) as string;
  let sceneName2 = node1.addScene("scene2", MockScene) as string;
  expect(sceneName1).toBe("scene1");
  node1.deleteScene(sceneName1);
  let keys = Object.keys(
    (arenaSotre.getNode(node1.getId() as string) as Node).getScenes()
  );
  expect(keys.length).toBe(1);
  node1.destroy();
  expect(node1.getScene(sceneName2)).toBeNull;
});
