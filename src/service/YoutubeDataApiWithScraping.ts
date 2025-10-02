import { ChannelId, PageFetcher, Scraper, VideoId } from "youtube-live-scraper";
import { ChannelApiResponse, IYoutubeDataApiV3, VideoApiResponse } from "../types";

export const YoutubeDataApiWithScraping: IYoutubeDataApiV3 = {
  async videos(videoId: VideoId): Promise<VideoApiResponse> {
    const page = await PageFetcher.getVideoPage(videoId);
    const likeCount = Scraper.getLikeCount(page);
    const liveViewCount = Scraper.getLiveViewCount(page);

    const title = Scraper.getVideoTitle(page);

    return {
      items: [
        {
          snippet: { title: title.title },
          statistics: { likeCount: (likeCount ?? 0).toString() },
          liveStreamingDetails: { concurrentViewers: liveViewCount.toString() },
        },
      ],
    };
  },

  async channels(channelId: ChannelId): Promise<ChannelApiResponse> {
    const page = await PageFetcher.getChannelPage(channelId);

    const title = Scraper.getChannelTitleFromChannelPage(page);
    const subscriberCount = Scraper.getSubscriberCountFromChannelPage(page);

    return {
      items: [
        {
          snippet: { title: title.title },
          statistics: { subscriberCount: subscriberCount.toString() },
        },
      ],
    };
  },
};
