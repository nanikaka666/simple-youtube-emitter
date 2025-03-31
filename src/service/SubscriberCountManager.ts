import { SubscriberCount } from "../core/SubscriberCount";

export class SubscriberCountManager {
  #bestSoFar: SubscriberCount;

  constructor(initialSubscriberCount: SubscriberCount) {
    this.#bestSoFar = initialSubscriberCount;
  }
  update(nextSubscriberCount: SubscriberCount) {
    if (this.#bestSoFar.check(nextSubscriberCount)) {
      this.#bestSoFar = nextSubscriberCount;
      return true;
    }
    return false;
  }
  get() {
    return this.#bestSoFar;
  }
}
