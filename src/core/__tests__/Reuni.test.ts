import { createReuni, Reuni, NodeAPI, storeObserver } from "src";

it("tests createReuni", () => {
  let reuni = createReuni();
  expect(reuni).toBeInstanceOf(Reuni);
});

it("tests reuni mount/unmount node", () => {
  let thread = Symbol("thread");
  let reuni = createReuni();
  let node1 = reuni.mountNode({ thread: thread });
  expect(reuni).toBeInstanceOf(Reuni);
  let node1_1 = reuni.mountNode({
    thread: thread,
    parentId: node1.getId()
  });
  expect(node1_1).toBeInstanceOf(NodeAPI);
  let node1_2 = reuni.mountNode({
    thread: thread,
    parentId: node1.getId()
  });
  reuni.unmoutNode(node1_2.getId());
  let keys = Object.keys(reuni.getNodeDict());
  expect(keys.length).toBe(3);
  reuni.unmoutNode(node1.getId());
  keys = Object.keys(reuni.getNodeDict());
  expect(keys.length).toBe(1);
});
