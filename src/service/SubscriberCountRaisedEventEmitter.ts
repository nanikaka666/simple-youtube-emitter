import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { SubscriberCountFetcher, SubscriberCountRaisedEvent } from "../types";
import { SubscriberCountManager } from "./SubscriberCountManager";
import { PollingInterval } from "../core/PollingInterval";
import { SafePollingInterval } from "../core/SafePollingInterval";
import { YoutubeApiKeyCredential } from "../core/YoutubeApiKeyCredential";
import { YoutubeApiReturnsError } from "../core/YoutubeApiReturnsError";
import { ChannelId } from "youtube-live-scraper";
import { SubscriberCountFetcherViaScraping } from "./SubscriberCountFetcherViaScraping";
import { SubscriberCountFetcherViaYoutubeDataApi } from "./SubscriberCountFetcherViaYoutubeDataApi";

export class SubscriberCountRaisedEventEmitter extends (EventEmitter as new () => TypedEmitter<SubscriberCountRaisedEvent>) {
  readonly #channelId: ChannelId;
  readonly #interval: PollingInterval;
  readonly #subscriberCountFetcher: SubscriberCountFetcher;
  #subscriberCountManager?: SubscriberCountManager;
  #isActivated: boolean;
  constructor(
    channelId: ChannelId,
    interval: PollingInterval,
    subscriberCountFetcher: SubscriberCountFetcher,
  ) {
    super();

    this.#channelId = channelId;
    this.#interval = interval;
    this.#subscriberCountFetcher = subscriberCountFetcher;
    this.#isActivated = false;
  }

  static initWithoutCredential(channelId: string, interval: number) {
    return new this(
      new ChannelId(channelId),
      new SafePollingInterval(interval),
      SubscriberCountFetcherViaScraping,
    );
  }

  static init(channelId: string, interval: number, credential: string) {
    return new this(
      new ChannelId(channelId),
      new SafePollingInterval(interval),
      new SubscriberCountFetcherViaYoutubeDataApi(new YoutubeApiKeyCredential(credential)),
    );
  }

  async #getSubscriberCount() {
    try {
      return await this.#subscriberCountFetcher.get(this.#channelId);
    } catch (err) {
      if (err instanceof YoutubeApiReturnsError) {
        this.emit("error", err);
      } else if (err instanceof Error) {
        this.emit("error", err);
      } else {
        this.emit("error", new Error("Failed to get subscriber count."));
      }
      return undefined;
    }
  }

  async #execute() {
    if (!this.#isActivated) {
      return;
    }
    if (this.#subscriberCountManager === undefined) {
      throw new Error("This method is called before initialization of manager.");
    }
    const nextSubscriberCount = await this.#getSubscriberCount();
    if (nextSubscriberCount === undefined) {
      return;
    }
    const currentSubscribeCount = this.#subscriberCountManager.get();
    if (this.#subscriberCountManager.update(nextSubscriberCount)) {
      this.emit("raised", currentSubscribeCount, nextSubscriberCount);
    }
    setTimeout(() => this.#execute(), this.#interval.value);
  }

  async start() {
    if (this.#isActivated) {
      return true;
    }

    const initialSubscriberCount = await this.#getSubscriberCount();
    if (initialSubscriberCount === undefined) {
      return false;
    }

    this.#subscriberCountManager = new SubscriberCountManager(initialSubscriberCount);

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
