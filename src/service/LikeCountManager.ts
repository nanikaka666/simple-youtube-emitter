import { LikeCount } from "../core/LikeCount";

export class LikeCountManager {
  #bestSoFar: LikeCount;

  /**
   * Note: initial like count will be ignored.
   *
   * If the video is already liked when this module runs, the first event will must be emitted.
   * That's why let set it to 0.
   * The parameter which constructor received is used for get the id and its title.
   * @param initialLikeCount
   */
  constructor(initialLikeCount: LikeCount) {
    this.#bestSoFar = new LikeCount(
      initialLikeCount.videoId,
      initialLikeCount.videoTitle,
      0
    );
  }
  update(nextLikeCount: LikeCount) {
    if (this.#bestSoFar.check(nextLikeCount)) {
      this.#bestSoFar = nextLikeCount;
      return true;
    }
    return false;
  }
  get() {
    return this.#bestSoFar;
  }
}
