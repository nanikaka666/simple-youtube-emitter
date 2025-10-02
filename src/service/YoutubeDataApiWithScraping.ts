import { ChannelId, PageFetcher, Scraper, VideoId } from "youtube-live-scraper";
import { ChannelApiResponse, IYoutubeDataApiV3, VideoApiResponse } from "../types";

export class LikeCountUnavailableError extends Error {}

export class YoutubeDataApiWithScraping implements IYoutubeDataApiV3 {
  async videos(videoId: VideoId): Promise<VideoApiResponse> {
    const page = await PageFetcher.getVideoPage(videoId);
    const likeCount = Scraper.getLikeCount(page);

    if (!likeCount) {
      throw new LikeCountUnavailableError();
    }

    const title = Scraper.getVideoTitle(page);

    return {
      items: [
        {
          snippet: { title: title.title },
          statistics: { likeCount: likeCount.toString() },
        },
      ],
    };
  }

  async channels(channelId: ChannelId): Promise<ChannelApiResponse> {
    const page = await PageFetcher.getChannelPage(channelId);

    const title = Scraper.getChannelTitleFromChannelPage(page);
    const subscriberCount = Scraper.getSubscriberCount(page);

    return {
      items: [
        {
          snippet: { title: title.title },
          statistics: { subscriberCount: subscriberCount.toString() },
        },
      ],
    };
  }
}
