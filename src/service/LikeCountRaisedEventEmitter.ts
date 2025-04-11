import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { parse } from "node-html-parser";
import { IFetchPage, IYoutubeDataApiV3, LikeCountRaisedEvent } from "../types";
import { NodeFetch } from "../infrastructure/NodeFetch";
import { YoutubeDataApiV3 } from "../infrastructure/YoutubeDataApiV3";
import { LikeCountManager } from "./LikeCountManager";
import { LikeCount } from "../core/LikeCount";
import { PollingInterval } from "../core/PollingInterval";
import { SafePollingInterval } from "../core/SafePollingInterval";
import { VideoId } from "../core/VideoId";
import { ChannelId } from "../core/ChannelId";
import { VideoTitle } from "../core/VideoTitle";
import { YoutubeApiKeyCredential } from "../core/YoutubeApiKeyCredential";
import { YoutubeApiReturnsError } from "../core/YoutubeApiReturnsError";

export class LikeCountRaisedEventEmitter extends (EventEmitter as new () => TypedEmitter<LikeCountRaisedEvent>) {
  readonly #channelId: ChannelId;
  readonly #interval: PollingInterval;
  readonly #youtubeDataApi: IYoutubeDataApiV3;
  readonly #fetchPage: IFetchPage;
  #likeCountManager?: LikeCountManager;
  #isActivated: boolean;
  constructor(
    channelId: ChannelId,
    interval: PollingInterval,
    youtubeDataApi: IYoutubeDataApiV3,
    fetchPage: IFetchPage,
  ) {
    super();

    this.#channelId = channelId;
    this.#interval = interval;
    this.#youtubeDataApi = youtubeDataApi;
    this.#fetchPage = fetchPage;
    this.#isActivated = false;
  }
  static init(channelId: string, interval: number, credential: string) {
    return new this(
      new ChannelId(channelId),
      new SafePollingInterval(interval),
      new YoutubeDataApiV3(new YoutubeApiKeyCredential(credential)),
      new NodeFetch(),
    );
  }
  async #getVideoId(): Promise<VideoId | undefined> {
    try {
      const livePageUrl = this.#channelId.isHandle
        ? `https://www.youtube.com/${this.#channelId.id}/live`
        : `https://www.youtube.com/channel/${this.#channelId.id}/live`;
      const body = await this.#fetchPage.fetchAsString(livePageUrl);
      const parsedBody = parse(body);
      const element = parsedBody.querySelector('link[rel="canonical"]');
      if (element === null) {
        this.emit("error", new Error(`Given channel doesn't have streaming or upcoming live.`));
        return undefined;
      }

      const href = element.getAttribute("href");
      if (href === undefined) {
        this.emit(
          "error",
          new Error("<link> element doesn't have href. Youtube DOM maybe changed."),
        );
        return undefined;
      }

      const matchResult = href.match(/^https:\/\/www\.youtube\.com\/watch\?v=(.+)$/);

      if (matchResult === null) {
        this.emit(
          "error",
          new Error(
            "This channel has no live-streaming or upcoming live, or content of href attribute is maybe changed.",
          ),
        );
        return undefined;
      }

      const id = matchResult.at(1);
      if (id === undefined) {
        this.emit("error", new Error("YouTube videoId format maybe changed."));
        return undefined;
      }

      return new VideoId(id);
    } catch (err) {
      this.emit("error", new Error("Failed to get videoId via scraping YouTube page."));
    }
  }

  async #getLikeCount(videoId: VideoId): Promise<LikeCount | undefined> {
    try {
      const json = await this.#youtubeDataApi.videos(videoId);

      return new LikeCount(
        videoId,
        new VideoTitle(json.items[0].snippet.title),
        Number(json.items[0].statistics.likeCount),
      );
    } catch (err) {
      if (err instanceof YoutubeApiReturnsError) {
        this.emit("error", err);
      } else {
        this.emit("error", new Error("Failed to get like count via YouTube videos API."));
      }
    }
  }

  async #execute() {
    if (!this.#isActivated) {
      return;
    }
    if (this.#likeCountManager === undefined) {
      throw new Error("This method is called before initialization of manager.");
    }
    const nextLikeCount = await this.#getLikeCount(this.#likeCountManager.get().videoId);
    if (nextLikeCount === undefined) {
      return;
    }
    const currentLikeCount = this.#likeCountManager.get();
    if (this.#likeCountManager.update(nextLikeCount)) {
      this.emit("raised", currentLikeCount, nextLikeCount);
    }
    setTimeout(this.#execute.bind(this), this.#interval.value);
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

    this.#likeCountManager = new LikeCountManager(initialLikeCount);

    setTimeout(this.#execute.bind(this), this.#interval.value);

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
