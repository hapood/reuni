import { createArena, getTaskDescriptor } from "src";
import MixedScene from "./MixedScene";
import MonoScene from "./MonoScene";

it("Scene works with cancel", done => {
  let arenaSotre = createArena();
  let node1 = arenaSotre.mountNode(null, "node1");
  let monoScene = node1.addScene("monoScene", MonoScene) as string;
  let mixedScene = node1.addScene("mixedScene", MixedScene) as string;
  node1.subscribe(
    {
      $: {
        [monoScene]: ["cnt"],
        [mixedScene]: ["cnt"]
      }
    },
    (isValid: boolean) => {
      let scene: MixedScene = node1.findScene(sceneName1);
      expect(scene.cnt).toBe(2);
      done();
    }
  );
  let scene: MixedScene = node1.findScene(sceneName1);
  let t = scene.cancelable();
  let task = getTaskDescriptor(t).cancel();
  scene.addAsync(2);
});
