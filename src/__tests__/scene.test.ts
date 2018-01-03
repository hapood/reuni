import { createArena, Node, getTaskDescriptor } from "src";
import MonoScene from "./MonoScene";

it("Scene works with subscribe", done => {
  let arenaSotre = createArena();
  let node1 = arenaSotre.mountNode(null, "node1");
  let sceneName = node1.addScene("sceneForTest", MonoScene) as string;
  let cbId = 0;
  node1.subscribe(
    {
      $: {
        [sceneName]: ["cnt"]
      }
    },
    (isValid: boolean) => {
      let scene: MonoScene =
        isValid == true ? node1.getScene(sceneName) : null;
      switch (cbId) {
        case 0:
          expect(scene.cnt).toBe(10);
          cbId++;
          break;
        case 1:
          expect(scene.cnt).toBe(30);
          cbId++;
          break;
        case 2:
          expect(isValid).toBe(false);
          done();
      }
    }
  );
  let scene: MonoScene = node1.getScene(sceneName);
  let t = scene.task();
  t.then(() => node1.deleteScene(sceneName));
});

it("Scene works with cancel", done => {
  let arenaSotre = createArena();
  let node1 = arenaSotre.mountNode(null, "node1");
  let sceneName = node1.addScene("sceneForTest", MonoScene) as string;
  node1.subscribe(
    {
      $: {
        [sceneName]: ["cnt"]
      }
    },
    (isValid: boolean) => {
      let scene: MonoScene = node1.getScene(sceneName);
      expect(scene.cnt).toBe(2);
      done();
    }
  );
  let scene: MonoScene = node1.getScene(sceneName);
  let t = scene.cancelable();
  let task = getTaskDescriptor(t).cancel();
  scene.addAsync(2);
});
