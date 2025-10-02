import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { IYoutubeDataApiV3, LikeCountRaisedEvent } from "../types";
import { YoutubeDataApiV3 } from "../infrastructure/YoutubeDataApiV3";
import { LikeCountManager } from "./LikeCountManager";
import { LikeCount } from "../core/LikeCount";
import { PollingInterval } from "../core/PollingInterval";
import { SafePollingInterval } from "../core/SafePollingInterval";
import { YoutubeApiKeyCredential } from "../core/YoutubeApiKeyCredential";
import { YoutubeApiReturnsError } from "../core/YoutubeApiReturnsError";
import { YoutubeDataApiWithScraping } from "../infrastructure/YoutubeDataApiWithScraping";
import { ChannelId, PageFetcher, VideoId, VideoTitle } from "youtube-live-scraper";

export class LikeCountRaisedEventEmitter extends (EventEmitter as new () => TypedEmitter<LikeCountRaisedEvent>) {
  readonly #channelId: ChannelId;
  readonly #interval: PollingInterval;
  readonly #youtubeDataApi: IYoutubeDataApiV3;
  #likeCountManager?: LikeCountManager;
  #isActivated: boolean;
  constructor(channelId: ChannelId, interval: PollingInterval, youtubeDataApi: IYoutubeDataApiV3) {
    super();

    this.#channelId = channelId;
    this.#interval = interval;
    this.#youtubeDataApi = youtubeDataApi;
    this.#isActivated = false;
  }
  static initWithoutCredential(channelId: string, interval: number) {
    return new this(
      new ChannelId(channelId),
      new SafePollingInterval(interval),
      YoutubeDataApiWithScraping,
    );
  }
  static init(channelId: string, interval: number, credential: string) {
    return new this(
      new ChannelId(channelId),
      new SafePollingInterval(interval),
      new YoutubeDataApiV3(new YoutubeApiKeyCredential(credential)),
    );
  }

  async #getVideoId(): Promise<VideoId | undefined> {
    try {
      const page = await PageFetcher.getLivePage(this.#channelId);
      if (page.type !== "video") {
        this.emit("error", new Error("This channel has no live-streaming or upcoming live."));
        return undefined;
      }

      return page.videoId;
    } catch (_err) {
      this.emit("error", new Error("Failed to get videoId via scraping YouTube page."));
      return undefined;
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
    setTimeout(() => this.#execute(), this.#interval.value);
  }

  async start(): Promise<boolean> {
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

    setTimeout(() => this.#execute(), this.#interval.value);

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
