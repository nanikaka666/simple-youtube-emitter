import { ChannelId, PageFetcher, Scraper } from "youtube-live-scraper";
import { SubscriberCountFetcher } from "../../types";
import { SubscriberCount } from "../../core/SubscriberCount";

export const SubscriberCountFetcherViaScraping: SubscriberCountFetcher = {
  async get(channelId: ChannelId) {
    const page = await PageFetcher.getChannelPage(channelId);
    return new SubscriberCount(channelId, Scraper.getSubscriberCountFromChannelPage(page));
  },
};
