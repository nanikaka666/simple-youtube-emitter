import { LiveViewCount } from "../../core/LiveViewCount";

export class LiveViewCountManager {
  #bestSoFar: LiveViewCount;

  /**
   * Note: initial live view count will be ignored.
   *
   * If the video is already viewed when this module runs, the first event will must be emitted.
   * That's why let set it to 0.
   * The parameter which constructor received is used for get the id and its title.
   */
  constructor(initialLiveViewCount: LiveViewCount) {
    this.#bestSoFar = new LiveViewCount(initialLiveViewCount.videoId, 0);
  }
  update(nextLiveViewCount: LiveViewCount) {
    if (this.#bestSoFar.check(nextLiveViewCount)) {
      this.#bestSoFar = nextLiveViewCount;
      return true;
    }
    return false;
  }
  get() {
    return this.#bestSoFar;
  }
}
