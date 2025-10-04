import { VideoId } from "youtube-live-scraper";
import { LikeCount } from "../../core/LikeCount";
import { LikeCountFetcher } from "../../types";
import { YoutubeApiKeyCredential } from "../../core/YoutubeApiKeyCredential";
import { YoutubeDataApiV3Client } from "./../YoutubeDataApiV3Client";

export class LikeCountFetcherViaYoutubeDataApi implements LikeCountFetcher {
  readonly #credential: YoutubeApiKeyCredential;
  constructor(credential: YoutubeApiKeyCredential) {
    this.#credential = credential;
  }
  async get(videoId: VideoId) {
    return new LikeCount(
      videoId,
      await YoutubeDataApiV3Client.getLikeCount(this.#credential, videoId),
    );
  }
}
