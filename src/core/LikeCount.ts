export class LikeCount {
  readonly videoId: string;
  readonly videoTitle: string;
  readonly value: number;
  constructor(videoId: string, videoTitle: string, value: number) {
    LikeCount.#validate(value);
    this.videoId = videoId;
    this.videoTitle = videoTitle;
    this.value = value;
  }
  check(nextLikeCount: LikeCount) {
    if (this.videoId !== nextLikeCount.videoId) {
      throw new Error(`Different videoId is detected.`);
    }
    return this.value < nextLikeCount.value;
  }
  static #validate(value: number) {
    if (value < 0) {
      throw new Error("value must be non-negative.");
    }
    if (!Number.isSafeInteger(value)) {
      throw new Error("value is too large for likeCount");
    }
  }
}
