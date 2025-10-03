import { ChannelId } from "youtube-live-scraper";
import { SubscriberCount } from "../core/SubscriberCount";
import { SubscriberCountFetcher } from "../types";
import { YoutubeApiKeyCredential } from "../core/YoutubeApiKeyCredential";
import { YoutubeDataApiV3Client } from "./YoutubeDataApiV3Client";

export class SubscriberCountFetcherViaYoutubeDataApi implements SubscriberCountFetcher {
  readonly #credential: YoutubeApiKeyCredential;
  constructor(credential: YoutubeApiKeyCredential) {
    this.#credential = credential;
  }
  async get(channelId: ChannelId) {
    return new SubscriberCount(
      channelId,
      await YoutubeDataApiV3Client.getSubscriberCount(this.#credential, channelId),
    );
  }
}
