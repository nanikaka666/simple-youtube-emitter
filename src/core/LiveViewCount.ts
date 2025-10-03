import { VideoId } from "youtube-live-scraper";
import { CountBase } from "./CountBase";

export class LiveViewCount extends CountBase {
  readonly videoId: VideoId;
  constructor(videoId: VideoId, value: number) {
    super(value);
    this.videoId = videoId;
  }
  check(nextLiveViewCount: LiveViewCount) {
    if (this.videoId !== nextLiveViewCount.videoId) {
      throw new Error(`Different videoId is detected.`);
    }
    return this.value < nextLiveViewCount.value;
  }
}
