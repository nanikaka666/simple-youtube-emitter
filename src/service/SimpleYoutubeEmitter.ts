import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { parse } from "node-html-parser";
import {
  IFetchPage,
  IntervalOptions,
  IYoutubeDataApiV3,
  SimpleYoutubeEvent,
} from "../types";
import { NodeFetch } from "../infrastructure/NodeFetch";
import { YoutubeDataApiV3 } from "../infrastructure/YoutubeDataApiV3";
import { LikeCountManager } from "./LikeCountManager";
import { LikeCount } from "../core/LikeCount";
import { SubscriberCountManager } from "./SubscriberCountManager";
import { SubscriberCount } from "../core/SubscriberCount";

export class SimpleYoutubeEmitter extends (EventEmitter as new () => TypedEmitter<SimpleYoutubeEvent>) {
  readonly #channelId: string;
  readonly #intervalOptions: IntervalOptions;
  readonly #youtubeDataApi: IYoutubeDataApiV3;
  readonly #fetchPage: IFetchPage;
  #likeCountManager?: LikeCountManager;
  #subscriberCountManager?: SubscriberCountManager;
  #isActivated: boolean;
  constructor(
    channelId: string,
    intervalOptions: IntervalOptions,
    youtubeDataApi: IYoutubeDataApiV3,
    fetchPage: IFetchPage
  ) {
    super();

    if (
      intervalOptions.forLikes < 1000 ||
      intervalOptions.forSubscribers < 1000
    ) {
      throw new Error("interval is too short.");
    }

    this.#channelId = channelId;
    this.#intervalOptions = intervalOptions;
    this.#youtubeDataApi = youtubeDataApi;
    this.#fetchPage = fetchPage;
    this.#isActivated = false;
  }
  static init(
    channelId: string,
    intervalOptions: IntervalOptions,
    credential: string
  ) {
    return new this(
      channelId,
      intervalOptions,
      new YoutubeDataApiV3(credential),
      new NodeFetch()
    );
  }
  async #getVideoId(): Promise<string | undefined> {
    try {
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
          new Error(`Given channel doesn't have streaming or upcoming live.`)
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
    } catch (err) {
      this.emit(
        "error",
        new Error("Failed to get videoId via scraping YouTube page.")
      );
    }
  }

  async #getLikeCount(videoId: string): Promise<LikeCount | undefined> {
    try {
      const json = await this.#youtubeDataApi.videos(videoId);

      return new LikeCount(
        videoId,
        json.items[0].snippet.title,
        Number(json.items[0].statistics.likeCount)
      );
    } catch (err) {
      this.emit(
        "error",
        new Error("Failed to get like count via YouTube videos API.")
      );
    }
  }

  async #getSubscriberCount(): Promise<SubscriberCount | undefined> {
    try {
      const json = await this.#youtubeDataApi.channels(this.#channelId);

      return new SubscriberCount(
        this.#channelId,
        json.items[0].snippet.title,
        Number(json.items[0].statistics.subscriberCount)
      );
    } catch (err) {
      this.emit(
        "error",
        new Error("Failed to get subscriber count via YouTube channels API.")
      );
    }
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
    if (nextLikeCount === undefined) {
      return;
    }
    const currentLikeCount = this.#likeCountManager.get();
    if (this.#likeCountManager.update(nextLikeCount)) {
      this.emit("likes", currentLikeCount, nextLikeCount);
    }
    setTimeout(
      this.#executeForLikeCount.bind(this),
      this.#intervalOptions.forLikes
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
    if (nextSubscriberCount === undefined) {
      return;
    }
    const currentSubscribeCount = this.#subscriberCountManager.get();
    if (this.#subscriberCountManager.update(nextSubscriberCount)) {
      this.emit("subscribers", currentSubscribeCount, nextSubscriberCount);
    }
    setTimeout(
      this.#executeForSubscriberCount.bind(this),
      this.#intervalOptions.forSubscribers
    );
  }

  async start(): Promise<Boolean> {
    if (this.#isActivated) {
      return true;
    }
    const videoId = await this.#getVideoId();
    if (videoId === undefined) {
      return false;
    }
    const initialLikeCount = await this.#getLikeCount(videoId);
    if (initialLikeCount === undefined) {
      return false;
    }

    const initialSubscriberCount = await this.#getSubscriberCount();
    if (initialSubscriberCount === undefined) {
      return false;
    }

    this.#likeCountManager = new LikeCountManager(initialLikeCount);
    this.#subscriberCountManager = new SubscriberCountManager(
      initialSubscriberCount
    );

    setTimeout(
      this.#executeForLikeCount.bind(this),
      this.#intervalOptions.forLikes
    );

    setTimeout(
      this.#executeForSubscriberCount.bind(this),
      this.#intervalOptions.forSubscribers
    );

    this.#isActivated = true;
    this.emit("start");
    return true;
  }

  close() {
    if (!this.#isActivated) {
      return;
    }
    this.#isActivated = false;
    this.emit("end");
  }
}
