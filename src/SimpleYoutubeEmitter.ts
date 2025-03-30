import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import fetch from "node-fetch";
import { parse } from "node-html-parser";
import {
  ChannelApiResponse,
  ChannelStatistics,
  SimpleYoutubeEvent,
  VideoApiResponse,
  VideoStatistics,
} from "../types";

export class SimpleYoutubeEmitter extends (EventEmitter as new () => TypedEmitter<SimpleYoutubeEvent>) {
  readonly #credential: string;
  readonly #channelId: string;
  constructor(credential: string, channelId: string) {
    super();
    this.#credential = credential;
    this.#channelId = channelId;
  }
  private async getVideoId(channelId: string): Promise<string | undefined> {
    const livePageUrl =
      channelId.charAt(0) === "@"
        ? `https://www.youtube.com/${channelId}/live`
        : `https://www.youtube.com/channel/${channelId}/live`;
    const response = await fetch(livePageUrl);
    const body = await response.text();
    const parsedBody = parse(body);
    const element = parsedBody.querySelector('link[rel="canonical"]');
    if (element === null) {
      this.emit(
        "error",
        new Error(
          `Given channel ${channelId} doesn't have streaming or upcoming live.`
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

  private async getVideoStatistics(videoId: string): Promise<VideoStatistics> {
    const videoApiUrl = "https://www.googleapis.com/youtube/v3/videos";
    const query = new URLSearchParams({
      id: videoId,
      key: this.#credential,
      part: ["snippet", "statistics"].join(","),
    });
    const url = `${videoApiUrl}?${query}`;

    const res = await fetch(url);
    const json = (await res.json()) as VideoApiResponse;

    return {
      videoId: videoId,
      videoTitle: json.items[0].snippet.title,
      likeCount: Number(json.items[0].statistics.likeCount),
    };
  }

  private async getChannelStatistics(
    channelId: string
  ): Promise<ChannelStatistics> {
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
    const json = (await res.json()) as ChannelApiResponse;

    return {
      channelId: channelId,
      channelTitle: json.items[0].snippet.title,
      subscriberCount: Number(json.items[0].statistics.subscriberCount),
    };
  }

  async watch(
    channelId: string,
    intervalMilliSeconds: number
  ): Promise<Boolean> {
    try {
      const videoId = await this.getVideoId(channelId);
      if (videoId === undefined) {
        return false;
      }
      const videoStatistics = await this.getVideoStatistics(videoId);
      console.log(videoStatistics);

      const channelStatistics = await this.getChannelStatistics(channelId);
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
