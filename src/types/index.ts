import { ChannelId, VideoId } from "youtube-live-scraper";
import { LikeCount } from "../core/LikeCount";
import { SubscriberCount } from "../core/SubscriberCount";
import { LiveViewCount } from "../core/LiveViewCount";

export type LiveViewCountRaisedEvent = {
  raised: (before: LiveViewCount, after: LiveViewCount) => void;
  start: () => void;
  end: () => void;
  error: (err: Error) => void;
};

/***********************
 * infrastrucre types
 ***********************/

export interface LikeCountFetcher {
  get(videoId: VideoId): Promise<LikeCount | undefined>;
}

export interface LiveViewCountFetcher {
  get(videoId: VideoId): Promise<LiveViewCount>;
}

export interface SubscriberCountFetcher {
  get(channelId: ChannelId): Promise<SubscriberCount>;
}
