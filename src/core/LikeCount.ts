import { VideoId } from "youtube-live-scraper";
import { CountBase } from "./CountBase";

export class LikeCount extends CountBase {
  readonly videoId: VideoId;
  constructor(videoId: VideoId, value: number) {
    super(value);
    this.videoId = videoId;
  }
  check(nextLikeCount: LikeCount) {
    if (this.videoId !== nextLikeCount.videoId) {
      throw new Error(`Different videoId is detected.`);
    }
    return this.value < nextLikeCount.value;
  }
}
