import { LikeCount } from "../core/LikeCount";

export type SimpleYoutubeEvent = {
  subs: (old: number, latest: number) => void;
  likes: (before: LikeCount, after: LikeCount) => void;
  start: () => void;
  end: () => void;
  error: (err: Error) => void;
};

export interface ChannelStatistics {
  channelId: string;
  channelTitle: string;
  subscriberCount: number;
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
  videos(videoId: string): Promise<VideoApiResponse>;
  channels(channelId: string): Promise<ChannelApiResponse>;
}

export interface IFetchPage {
  fetchAsString(url: string): Promise<string>;
}
