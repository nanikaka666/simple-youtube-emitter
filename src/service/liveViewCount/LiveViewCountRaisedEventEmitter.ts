import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { ChannelId, VideoId } from "youtube-live-scraper";
import { LiveViewCount } from "../../core/LiveViewCount";
import { PollingInterval } from "../../core/PollingInterval";
import { SafePollingInterval } from "../../core/SafePollingInterval";
import { YoutubeApiKeyCredential } from "../../core/YoutubeApiKeyCredential";
import { YoutubeApiReturnsError } from "../../core/YoutubeApiReturnsError";
import { LiveViewCountFetcher } from "../../types";
import { ClosestLiveVideoIdFetcher } from "./../ClosestLiveVideoIdFetcher";
import { LiveViewCountFetcherViaScraping } from "./LiveViewCountFetcherViaScraping";
import { LiveViewCountFetcherViaYoutubeDataApi } from "./LiveViewCountFetcherViaYoutubeDataApi";
import { LiveViewCountManager } from "./LiveViewCountManager";

export class LiveViewCountRaisedEventEmitter extends (EventEmitter as new () => TypedEmitter<LiveViewCountRaisedEvent>) {
  readonly #channelId: ChannelId;
  readonly #interval: PollingInterval;
  readonly #liveViewCountFetcher: LiveViewCountFetcher;
  #liveViewCountManager?: LiveViewCountManager;
  #isActivated: boolean;
  constructor(
    channelId: ChannelId,
    interval: PollingInterval,
    liveViewCountFetcher: LiveViewCountFetcher,
  ) {
    super();

    this.#channelId = channelId;
    this.#interval = interval;
    this.#liveViewCountFetcher = liveViewCountFetcher;
    this.#isActivated = false;
  }
  static initWithoutCredential(channelId: string, interval: number) {
    return new this(
      new ChannelId(channelId),
      new SafePollingInterval(interval),
      LiveViewCountFetcherViaScraping,
    );
  }
  static init(channelId: string, interval: number, credential: string) {
    return new this(
      new ChannelId(channelId),
      new SafePollingInterval(interval),
      new LiveViewCountFetcherViaYoutubeDataApi(new YoutubeApiKeyCredential(credential)),
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

  async #getLiveViewCount(videoId: VideoId) {
    try {
      const liveViewCount = await this.#liveViewCountFetcher.get(videoId);
      if (liveViewCount === undefined) {
        this.emit("error", new Error("Fail to fetch live view count, the owner set it invisible."));
        return undefined;
      }
      return liveViewCount;
    } catch (err) {
      if (err instanceof YoutubeApiReturnsError) {
        this.emit("error", err);
      } else if (err instanceof Error) {
        this.emit("error", err);
      } else {
        this.emit("error", new Error("Fail to fetch live view count."));
      }

      return undefined;
    }
  }

  async #execute() {
    if (!this.#isActivated) {
      return;
    }
    if (this.#liveViewCountManager === undefined) {
      throw new Error("This method is called before initialization of manager.");
    }
    const nextLiveViewCount = await this.#getLiveViewCount(
      this.#liveViewCountManager.get().videoId,
    );
    if (nextLiveViewCount !== undefined) {
      const currentLiveViewCount = this.#liveViewCountManager.get();
      if (this.#liveViewCountManager.update(nextLiveViewCount)) {
        this.emit("raised", currentLiveViewCount, nextLiveViewCount);
      }
    }
    setTimeout(() => this.#execute(), this.#interval.value);
  }

  async start() {
    if (this.#isActivated) {
      return true;
    }
    if (this.#liveViewCountManager !== undefined) {
      return false;
    }
    const videoId = await this.#getVideoId();
    if (videoId === undefined) {
      return false;
    }
    const initialLiveViewCount = await this.#getLiveViewCount(videoId);
    if (initialLiveViewCount === undefined) {
      return false;
    }

    this.#liveViewCountManager = new LiveViewCountManager(initialLiveViewCount);

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

export type LiveViewCountRaisedEvent = {
  raised: (before: LiveViewCount, after: LiveViewCount) => void;
  start: () => void;
  end: () => void;
  error: (err: Error) => void;
};
