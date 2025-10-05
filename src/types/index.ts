import { ChannelId, VideoId } from "youtube-live-scraper";
import { LikeCount } from "../core/LikeCount";
import { SubscriberCount } from "../core/SubscriberCount";
import { LiveViewCount } from "../core/LiveViewCount";

export interface LikeCountFetcher {
  /**
   * If owner set like count to invisible, then `undefined` will be returned.
   */
  get(videoId: VideoId): Promise<LikeCount | undefined>;
}

export interface LiveViewCountFetcher {
  /**
   * If owner set live view count to invisible, then `undefined` will be returned.
   *
   * Return `0` when before the live stream begin, even if waiting listeners are there.
   */
  get(videoId: VideoId): Promise<LiveViewCount | undefined>;
}

export interface SubscriberCountFetcher {
  get(channelId: ChannelId): Promise<SubscriberCount>;
}
