import Store from "../core/Store";

export default class StoreNotAvailableError extends Error {
  constructor(store: Store) {
    super(`Store [${store.getName()}] is not available now.`);
    Object.setPrototypeOf(this, StoreNotAvailableError.prototype);
  }
}
