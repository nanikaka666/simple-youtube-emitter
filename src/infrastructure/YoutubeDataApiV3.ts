import { ChannelId } from "../core/ChannelId";
import { VideoId } from "../core/VideoId";
import { YoutubeApiKeyCredential } from "../core/YoutubeApiKeyCredential";
import { YoutubeApiReturnsError } from "../core/YoutubeApiReturnsError";
import {
  ChannelApiResponse,
  IYoutubeDataApiV3,
  VideoApiResponse,
} from "../types";

export class YoutubeDataApiV3 implements IYoutubeDataApiV3 {
  readonly #credential: YoutubeApiKeyCredential;
  constructor(credential: YoutubeApiKeyCredential) {
    this.#credential = credential;
  }
  async videos(videoId: VideoId) {
    const videoApiUrl = "https://www.googleapis.com/youtube/v3/videos";
    const query = new URLSearchParams({
      id: videoId.id,
      key: this.#credential.credential,
      part: ["snippet", "statistics"].join(","),
    });
    const url = `${videoApiUrl}?${query}`;

    const res = await fetch(url);
    const json = await res.json();
    if ("error" in json) {
      throw new YoutubeApiReturnsError(
        "Youtube API returns an error. API key credential is maybe invalid."
      );
    }
    return json as VideoApiResponse;
  }

  async channels(channelId: ChannelId): Promise<ChannelApiResponse> {
    const channelApiUrl = "https://www.googleapis.com/youtube/v3/channels";
    const paramsBase = {
      key: this.#credential.credential,
      part: ["snippet", "statistics"].join(","),
    };

    const params = channelId.isHandle
      ? { ...paramsBase, forHandle: channelId.id }
      : { ...paramsBase, id: channelId.id };
    const query = new URLSearchParams(params);
    const url = `${channelApiUrl}?${query}`;

    const res = await fetch(url);
    const json = await res.json();
    if ("error" in json) {
      throw new YoutubeApiReturnsError(
        "Youtube API returns an error. API key credential is maybe invalid."
      );
    }
    return json as ChannelApiResponse;
  }
}
