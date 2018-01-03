import { createArena, ArenaStore, Node, NodeAPI } from "src";
import SceneForTest from "./SceneForTest";

it("works with real scene", done => {
  let arenaSotre = createArena();
  let node1 = arenaSotre.mountNode(null, "node1");
  let sceneName = node1.addScene("sceneForTest", SceneForTest) as string;
  node1.subscribe(
    {
      $: {
        node1: []
      }
    },
    () => {
      let scene: SceneForTest = node1.getScene(sceneName);
      console.log(scene.name, scene.cnt);
      done();
    }
  );
  let scene: SceneForTest = node1.getScene(sceneName);
  let t = scene.transaction();
});
