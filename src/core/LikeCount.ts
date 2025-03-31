import { CountBase } from "./CountBase";

export class LikeCount extends CountBase {
  readonly videoId: string;
  readonly videoTitle: string;
  constructor(videoId: string, videoTitle: string, value: number) {
    super(value);
    this.videoId = videoId;
    this.videoTitle = videoTitle;
  }
  check(nextLikeCount: LikeCount) {
    if (this.videoId !== nextLikeCount.videoId) {
      throw new Error(`Different videoId is detected.`);
    }
    return this.value < nextLikeCount.value;
  }
}
