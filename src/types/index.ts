import { ChannelId, VideoId } from "youtube-live-scraper";
import { LikeCount } from "../core/LikeCount";
import { SubscriberCount } from "../core/SubscriberCount";
import { LiveViewCount } from "../core/LiveViewCount";

export type LikeCountRaisedEvent = {
  raised: (before: LikeCount, after: LikeCount) => void;
  start: () => void;
  end: () => void;
  error: (err: Error) => void;
};

export type SubscriberCountRaisedEvent = {
  raised: (before: SubscriberCount, after: SubscriberCount) => void;
  start: () => void;
  end: () => void;
  error: (err: Error) => void;
};

export type LiveViewCountRaisedEvent = {
  raised: (before: LiveViewCount, after: LiveViewCount) => void;
  start: () => void;
  end: () => void;
  error: (err: Error) => void;
};

/***********************
 * infrastrucre types
 ***********************/

export interface VideoStatisticsResponse {
  likeCount: string;
}

export interface VideoSnippetResponse {
  title: string;
}

export interface LiveStreamingDetailsResponse {
  concurrentViewers: string;
}

export interface VideoApiResponse {
  items: [
    {
      snippet: VideoSnippetResponse;
      statistics: VideoStatisticsResponse;
      liveStreamingDetails: LiveStreamingDetailsResponse;
    },
  ];
}

export interface ChannelStatisticsResponse {
  subscriberCount: string;
}

export interface ChannelSnippetResponse {
  title: string;
}

export interface ChannelApiResponse {
  items: [{ snippet: ChannelSnippetResponse; statistics: ChannelStatisticsResponse }];
}

export interface IYoutubeDataApiV3 {
  videos(videoId: VideoId): Promise<VideoApiResponse>;
  channels(channelId: ChannelId): Promise<ChannelApiResponse>;
}

export interface LikeCountFetcher {
  get(videoId: VideoId): Promise<LikeCount | undefined>;
}

export interface LiveViewCountFetcher {
  get(videoId: VideoId): Promise<LiveViewCount>;
}

export interface SubscriberCountFetcher {
  get(channelId: ChannelId): Promise<SubscriberCount>;
}
