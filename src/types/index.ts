import { ChannelId, VideoId } from "youtube-live-scraper";
import { LikeCount } from "../core/LikeCount";
import { SubscriberCount } from "../core/SubscriberCount";
import { LiveViewCount } from "../core/LiveViewCount";

export interface LikeCountFetcher {
  get(videoId: VideoId): Promise<LikeCount | undefined>;
}

export interface LiveViewCountFetcher {
  get(videoId: VideoId): Promise<LiveViewCount>;
}

export interface SubscriberCountFetcher {
  get(channelId: ChannelId): Promise<SubscriberCount>;
}
