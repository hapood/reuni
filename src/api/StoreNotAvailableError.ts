import Store from "../core/Store";

export default class StoreNotExistError extends Error {
  constructor(store: Store) {
    super(`Store [${store.getName()}] is not available now.`);
    Object.setPrototypeOf(this, StoreNotExistError.prototype);
  }
}
