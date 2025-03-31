import { ChannelId } from "../core/ChannelId";
import { LikeCount } from "../core/LikeCount";
import { SubscriberCount } from "../core/SubscriberCount";
import { VideoId } from "../core/VideoId";

export type SimpleYoutubeEvent = {
  subscribers: (before: SubscriberCount, after: SubscriberCount) => void;
  likes: (before: LikeCount, after: LikeCount) => void;
  start: () => void;
  end: () => void;
  error: (err: Error) => void;
};

export interface IntervalOptions {
  forLikes: number;
  forSubscribers: number;
}

/***********************
 * infrastrucre types
 ***********************/

export interface VideoStatisticsResponse {
  likeCount: string;
}

export interface VideoSnippetResponse {
  title: string;
}

export interface VideoApiResponse {
  items: [
    { snippet: VideoSnippetResponse; statistics: VideoStatisticsResponse }
  ];
}

export interface ChannelStatisticsResponse {
  subscriberCount: number;
}

export interface ChannelSnippetResponse {
  title: string;
}

export interface ChannelApiResponse {
  items: [
    { snippet: ChannelSnippetResponse; statistics: ChannelStatisticsResponse }
  ];
}

export interface IYoutubeDataApiV3 {
  videos(videoId: VideoId): Promise<VideoApiResponse>;
  channels(channelId: ChannelId): Promise<ChannelApiResponse>;
}

export interface IFetchPage {
  fetchAsString(url: string): Promise<string>;
}
