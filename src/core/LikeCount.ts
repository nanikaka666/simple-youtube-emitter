import { VideoId, VideoTitle } from "youtube-live-scraper";
import { CountBase } from "./CountBase";

export class LikeCount extends CountBase {
  readonly videoId: VideoId;
  readonly videoTitle: VideoTitle;
  constructor(videoId: VideoId, videoTitle: VideoTitle, value: number) {
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
