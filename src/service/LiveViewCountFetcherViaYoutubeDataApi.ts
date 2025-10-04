import { VideoId } from "youtube-live-scraper";
import { LiveViewCount } from "../core/LiveViewCount";
import { LiveViewCountFetcher } from "../types";
import { YoutubeApiKeyCredential } from "../core/YoutubeApiKeyCredential";
import { YoutubeDataApiV3Client } from "./YoutubeDataApiV3Client";

export class LiveViewCountFetcherViaYoutubeDataApi implements LiveViewCountFetcher {
  readonly #credential: YoutubeApiKeyCredential;
  constructor(credential: YoutubeApiKeyCredential) {
    this.#credential = credential;
  }
  async get(videoId: VideoId) {
    return new LiveViewCount(
      videoId,
      await YoutubeDataApiV3Client.getLiveViewCount(this.#credential, videoId),
    );
  }
}
