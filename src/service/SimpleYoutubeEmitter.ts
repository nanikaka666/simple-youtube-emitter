import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { parse } from "node-html-parser";
import {
  ChannelStatistics,
  IFetchPage,
  IYoutubeDataApiV3,
  SimpleYoutubeEvent,
  VideoStatistics,
} from "../types";
import { NodeFetch } from "../infrastructure/NodeFetch";
import { YoutubeDataApiV3 } from "../infrastructure/YoutubeDataApiV3";

export class SimpleYoutubeEmitter extends (EventEmitter as new () => TypedEmitter<SimpleYoutubeEvent>) {
  readonly #channelId: string;
  readonly #youtubeDataApi: IYoutubeDataApiV3;
  readonly #fetchPage: IFetchPage;
  constructor(
    channelId: string,
    youtubeDataApi: IYoutubeDataApiV3,
    fetchPage: IFetchPage
  ) {
    super();
    this.#channelId = channelId;
    this.#youtubeDataApi = youtubeDataApi;
    this.#fetchPage = fetchPage;
  }
  static init(channelId: string, credential: string) {
    return new this(
      channelId,
      new YoutubeDataApiV3(credential),
      new NodeFetch()
    );
  }
  async #getVideoId(): Promise<string | undefined> {
    const livePageUrl =
      this.#channelId.charAt(0) === "@"
        ? `https://www.youtube.com/${this.#channelId}/live`
        : `https://www.youtube.com/channel/${this.#channelId}/live`;
    const body = await this.#fetchPage.fetchAsString(livePageUrl);
    const parsedBody = parse(body);
    const element = parsedBody.querySelector('link[rel="canonical"]');
    if (element === null) {
      this.emit(
        "error",
        new Error(
          `Given channel ${
            this.#channelId
          } doesn't have streaming or upcoming live.`
        )
      );
      return undefined;
    }

    const href = element.getAttribute("href");
    if (href === undefined) {
      this.emit(
        "error",
        new Error(
          "<link> element doesn't have href. Youtube DOM maybe changed."
        )
      );
      return undefined;
    }

    const matchResult = href.match(
      /https:\/\/www\.youtube\.com\/watch\?v=(.+)/
    );

    if (matchResult === null) {
      this.emit(
        "error",
        new Error(
          "This channel has no live-streaming or upcoming live, or content of href attribute is maybe changed."
        )
      );
      return undefined;
    }

    return matchResult.at(1);
  }

  async #getVideoStatistics(videoId: string): Promise<VideoStatistics> {
    const json = await this.#youtubeDataApi.videos(videoId);

    return {
      videoId: videoId,
      videoTitle: json.items[0].snippet.title,
      likeCount: Number(json.items[0].statistics.likeCount),
    };
  }

  async #getChannelStatistics(): Promise<ChannelStatistics> {
    const json = await this.#youtubeDataApi.channels(this.#channelId);

    return {
      channelId: this.#channelId,
      channelTitle: json.items[0].snippet.title,
      subscriberCount: Number(json.items[0].statistics.subscriberCount),
    };
  }

  async watch(intervalMilliSeconds: number): Promise<Boolean> {
    try {
      const videoId = await this.#getVideoId();
      if (videoId === undefined) {
        return false;
      }
      const videoStatistics = await this.#getVideoStatistics(videoId);
      console.log(videoStatistics);

      const channelStatistics = await this.#getChannelStatistics();
      console.log(channelStatistics);

      this.emit("start");
      return true;
    } catch (err: unknown) {
      console.log(err);
      this.emit("error", new Error("Begining of watch is failed."));
      return false;
    }
  }
}
