import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { parse } from "node-html-parser";
import { IFetchPage, IYoutubeDataApiV3, SimpleYoutubeEvent } from "../types";
import { NodeFetch } from "../infrastructure/NodeFetch";
import { YoutubeDataApiV3 } from "../infrastructure/YoutubeDataApiV3";
import { LikeCountManager } from "./LikeCountManager";
import { LikeCount } from "../core/LikeCount";
import { SubscriberCountManager } from "./SubscriberCountManager";
import { SubscriberCount } from "../core/SubscriberCount";
import { env } from "process";

export class SimpleYoutubeEmitter extends (EventEmitter as new () => TypedEmitter<SimpleYoutubeEvent>) {
  readonly #channelId: string;
  readonly #intervalMilliSeconds: number;
  readonly #youtubeDataApi: IYoutubeDataApiV3;
  readonly #fetchPage: IFetchPage;
  #likeCountManager?: LikeCountManager;
  #subscriberCountManager?: SubscriberCountManager;
  #isActivated: boolean;
  constructor(
    channelId: string,
    intervalMilliSeconds: number,
    youtubeDataApi: IYoutubeDataApiV3,
    fetchPage: IFetchPage
  ) {
    super();

    if (intervalMilliSeconds < 1000) {
      throw new Error("interval is too short.");
    }

    this.#channelId = channelId;
    this.#intervalMilliSeconds = intervalMilliSeconds;
    this.#youtubeDataApi = youtubeDataApi;
    this.#fetchPage = fetchPage;
    this.#isActivated = false;
  }
  static init(
    channelId: string,
    intervalMilliSeconds: number,
    credential: string
  ) {
    return new this(
      channelId,
      intervalMilliSeconds,
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

  async #getLikeCount(videoId: string): Promise<LikeCount> {
    const json = await this.#youtubeDataApi.videos(videoId);

    return new LikeCount(
      videoId,
      json.items[0].snippet.title,
      Number(json.items[0].statistics.likeCount)
    );
  }

  async #getSubscriberCount(): Promise<SubscriberCount> {
    const json = await this.#youtubeDataApi.channels(this.#channelId);

    return new SubscriberCount(
      this.#channelId,
      json.items[0].snippet.title,
      Number(json.items[0].statistics.subscriberCount)
    );
  }

  async #executeForLikeCount() {
    if (!this.#isActivated) {
      return;
    }
    if (this.#likeCountManager === undefined) {
      throw new Error(
        "This method is called before initialization of manager."
      );
    }
    const nextLikeCount = await this.#getLikeCount(
      this.#likeCountManager.get().videoId
    );
    const currentLikeCount = this.#likeCountManager.get();
    if (this.#likeCountManager.update(nextLikeCount)) {
      this.emit("likes", currentLikeCount, nextLikeCount);
    }
    setTimeout(
      this.#executeForLikeCount.bind(this),
      this.#intervalMilliSeconds
    );
  }

  async #executeForSubscriberCount() {
    if (!this.#isActivated) {
      return;
    }
    if (this.#subscriberCountManager === undefined) {
      throw new Error(
        "This method is called before initialization of manager."
      );
    }
    const nextSubscriberCount = await this.#getSubscriberCount();
    const currentSubscribeCount = this.#subscriberCountManager.get();
    if (this.#subscriberCountManager.update(nextSubscriberCount)) {
      this.emit("subscribers", currentSubscribeCount, nextSubscriberCount);
    }
    setTimeout(
      this.#executeForSubscriberCount.bind(this),
      this.#intervalMilliSeconds
    );
  }

  async start(): Promise<Boolean> {
    try {
      if (this.#isActivated) {
        return true;
      }
      const videoId = await this.#getVideoId();
      if (videoId === undefined) {
        return false;
      }
      const initialLikeCount = await this.#getLikeCount(videoId);
      this.#likeCountManager = new LikeCountManager(initialLikeCount);

      const initialSubscriberCount = await this.#getSubscriberCount();
      this.#subscriberCountManager = new SubscriberCountManager(
        initialSubscriberCount
      );

      setTimeout(
        this.#executeForLikeCount.bind(this),
        this.#intervalMilliSeconds
      );

      setTimeout(
        this.#executeForSubscriberCount.bind(this),
        this.#intervalMilliSeconds
      );

      this.#isActivated = true;
      this.emit("start");
      return true;
    } catch (err: unknown) {
      this.emit("error", new Error("Begining of watch is failed."));
      return false;
    }
  }

  close() {
    if (!this.#isActivated) {
      return;
    }
    this.#isActivated = false;
    this.emit("end");
  }
}
