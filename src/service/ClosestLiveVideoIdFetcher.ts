import { ChannelId, PageFetcher } from "youtube-live-scraper";

export const ClosestLiveVideoIdFetcher = {
  async get(channelId: ChannelId) {
    const page = await PageFetcher.getLivePage(channelId);
    if (page.type !== "video") {
      return undefined;
    }
    return page.videoId;
  },
};
