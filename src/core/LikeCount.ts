import { CountBase } from "./CountBase";
import { VideoId } from "./VideoId";

export class LikeCount extends CountBase {
  readonly videoId: VideoId;
  readonly videoTitle: string;
  constructor(videoId: VideoId, videoTitle: string, value: number) {
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
