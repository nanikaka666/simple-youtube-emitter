import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { LikeCountFetcher } from "../../types";
import { LikeCountManager } from "./LikeCountManager";
import { PollingInterval } from "../../core/PollingInterval";
import { SafePollingInterval } from "../../core/SafePollingInterval";
import { YoutubeApiKeyCredential } from "../../core/YoutubeApiKeyCredential";
import { YoutubeApiReturnsError } from "../../core/YoutubeApiReturnsError";
import { ChannelId, VideoId } from "youtube-live-scraper";
import { LikeCountFetcherViaScraping } from "./LikeCountFetcherViaScraping";
import { LikeCountFetcherViaYoutubeDataApi } from "./LikeCountFetcherViaYoutubeDataApi";
import { ClosestLiveVideoIdFetcher } from "./../ClosestLiveVideoIdFetcher";
import { LikeCount } from "../../core/LikeCount";

export class LikeCountRaisedEventEmitter extends (EventEmitter as new () => TypedEmitter<LikeCountRaisedEvent>) {
  readonly #channelId: ChannelId;
  readonly #interval: PollingInterval;
  readonly #likeCountFetcher: LikeCountFetcher;
  #likeCountManager?: LikeCountManager;
  #isActivated: boolean;
  constructor(channelId: ChannelId, interval: PollingInterval, likeCountFetcher: LikeCountFetcher) {
    super();

    this.#channelId = channelId;
    this.#interval = interval;
    this.#likeCountFetcher = likeCountFetcher;
    this.#isActivated = false;
  }
  static initWithoutCredential(channelId: string, interval: number) {
    return new this(
      new ChannelId(channelId),
      new SafePollingInterval(interval),
      LikeCountFetcherViaScraping,
    );
  }
  static init(channelId: string, interval: number, credential: string) {
    return new this(
      new ChannelId(channelId),
      new SafePollingInterval(interval),
      new LikeCountFetcherViaYoutubeDataApi(new YoutubeApiKeyCredential(credential)),
    );
  }

  async #getVideoId() {
    try {
      const res = await ClosestLiveVideoIdFetcher.get(this.#channelId);
      if (res === undefined) {
        this.emit("error", new Error("This channel has no live-streaming or upcoming live."));
        return undefined;
      }
      return res;
    } catch (e) {
      if (e instanceof Error) {
        this.emit("error", e);
      } else {
        this.emit("error", new Error("Failed to get closest live video id."));
      }

      return undefined;
    }
  }

  async #getLikeCount(videoId: VideoId) {
    try {
      return await this.#likeCountFetcher.get(videoId);
    } catch (err) {
      if (err instanceof YoutubeApiReturnsError) {
        this.emit("error", err);
      } else if (err instanceof Error) {
        this.emit("error", err);
      } else {
        this.emit("error", new Error("Fail to fetch like count."));
      }

      return undefined;
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

  async start() {
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

export type LikeCountRaisedEvent = {
  raised: (before: LikeCount, after: LikeCount) => void;
  start: () => void;
  end: () => void;
  error: (err: Error) => void;
};
