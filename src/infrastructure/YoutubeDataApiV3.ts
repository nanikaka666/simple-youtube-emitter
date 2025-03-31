import {
  ChannelApiResponse,
  IYoutubeDataApiV3,
  VideoApiResponse,
} from "../types";

export class YoutubeDataApiV3 implements IYoutubeDataApiV3 {
  readonly #credential: string;
  constructor(credential: string) {
    this.#credential = credential;
  }
  async videos(videoId: string) {
    const videoApiUrl = "https://www.googleapis.com/youtube/v3/videos";
    const query = new URLSearchParams({
      id: videoId,
      key: this.#credential,
      part: ["snippet", "statistics"].join(","),
    });
    const url = `${videoApiUrl}?${query}`;

    const res = await fetch(url);
    return (await res.json()) as VideoApiResponse;
  }

  async channels(channelId: string): Promise<ChannelApiResponse> {
    const channelApiUrl = "https://www.googleapis.com/youtube/v3/channels";
    const paramsBase = {
      key: this.#credential,
      part: ["snippet", "statistics"].join(","),
    };

    const params =
      channelId.charAt(0) === "@"
        ? { ...paramsBase, forHandle: channelId }
        : { ...paramsBase, id: channelId };
    const query = new URLSearchParams(params);
    const url = `${channelApiUrl}?${query}`;

    const res = await fetch(url);
    return (await res.json()) as ChannelApiResponse;
  }
}
