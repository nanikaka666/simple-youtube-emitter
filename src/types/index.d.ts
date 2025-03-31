export type SimpleYoutubeEvent = {
  subs: (old: number, latest: number) => void;
  fav: (old: number, latest: number) => void;
  start: () => void;
  end: () => void;
  error: (err: Error) => void;
};

export interface VideoStatistics {
  videoId: string;
  videoTitle: string;
  likeCount: number;
}

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

export interface ChannelStatistics {
  channelId: string;
  channelTitle: string;
  subscriberCount: number;
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
