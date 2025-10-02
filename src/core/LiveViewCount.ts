import { VideoId, VideoTitle } from "youtube-live-scraper";
import { CountBase } from "./CountBase";

export class LiveViewCount extends CountBase {
  readonly videoId: VideoId;
  readonly videoTitle: VideoTitle;
  constructor(videoId: VideoId, videoTitle: VideoTitle, value: number) {
    super(value);
    this.videoId = videoId;
    this.videoTitle = videoTitle;
  }
  check(nextLiveViewCount: LiveViewCount) {
    if (this.videoId !== nextLiveViewCount.videoId) {
      throw new Error(`Different videoId is detected.`);
    }
    return this.value < nextLiveViewCount.value;
  }
}
