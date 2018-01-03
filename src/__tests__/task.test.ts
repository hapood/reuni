import { createArena, getTaskDescriptor } from "src";
import MixedScene from "./MixedScene";

it("Scene works with cancel", done => {
  let arenaSotre = createArena();
  let node1 = arenaSotre.mountNode(null, "node1");
  let sceneName1 = node1.addScene("sceneForTest1", MixedScene) as string;
  let sceneName2 = node1.addScene("sceneForTest2", MixedScene) as string;
  node1.subscribe(
    {
      $: {
        [sceneName1]: ["cnt"],
        [sceneName2]: ["cnt"]
      }
    },
    (isValid: boolean) => {
      let scene: MixedScene = node1.getScene(sceneName1);
      expect(scene.cnt).toBe(2);
      done();
    }
  );
  let scene: MixedScene = node1.getScene(sceneName1);
  let t = scene.cancelable();
  let task = getTaskDescriptor(t).cancel();
  scene.addAsync(2);
});
