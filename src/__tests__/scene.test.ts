import { createArena, ArenaStore, Node, NodeAPI, getTransaction } from "src";
import SceneForTest from "./SceneForTest";

it("Scene works with subscribe", done => {
  let arenaSotre = createArena();
  let node1 = arenaSotre.mountNode(null, "node1");
  let sceneName = node1.addScene("sceneForTest", SceneForTest) as string;
  let cbId = 0;
  node1.subscribe(
    {
      $: {
        [sceneName]: ["cnt"]
      }
    },
    (isValid: boolean) => {
      let scene: SceneForTest =
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
  let scene: SceneForTest = node1.getScene(sceneName);
  let t = scene.transaction();
  t.then(() => node1.deleteScene(sceneName));
});

it("Scene works with cancel", done => {
  let arenaSotre = createArena();
  let node1 = arenaSotre.mountNode(null, "node1");
  let sceneName = node1.addScene("sceneForTest", SceneForTest) as string;
  node1.subscribe(
    {
      $: {
        [sceneName]: ["cnt"]
      }
    },
    (isValid: boolean) => {
      let scene: SceneForTest = node1.getScene(sceneName);
      expect(scene.cnt).toBe(2);
      done();
    }
  );
  let scene: SceneForTest = node1.getScene(sceneName);
  let t = scene.cancelable();
  let transaction = getTransaction(t).cancel();
  scene.addAsync(2);
});
