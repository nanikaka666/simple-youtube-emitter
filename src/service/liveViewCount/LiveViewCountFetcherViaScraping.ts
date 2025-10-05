import { PageFetcher, Scraper } from "youtube-live-scraper";
import { LiveViewCountFetcher } from "../../types";
import { LiveViewCount } from "../../core/LiveViewCount";

export const LiveViewCountFetcherViaScraping: LiveViewCountFetcher = {
  get: async (videoId) => {
    const page = await PageFetcher.getVideoPage(videoId);
    if (Scraper.isLiveNow(page)) {
      return new LiveViewCount(videoId, Scraper.getLiveViewCount(page));
    }
    return new LiveViewCount(videoId, 0);
  },
};
