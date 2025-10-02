import { PageFetcher, Scraper, VideoId } from "youtube-live-scraper";
import { LikeCountFetcher } from "../types";
import { LikeCount } from "../core/LikeCount";

export const LikeCountFetcherViaScraping: LikeCountFetcher = {
  async get(videoId: VideoId) {
    const page = await PageFetcher.getVideoPage(videoId);
    const likeCount = Scraper.getLikeCount(page);

    if (likeCount === undefined) {
      return undefined;
    }

    return new LikeCount(videoId, likeCount);
  },
};
