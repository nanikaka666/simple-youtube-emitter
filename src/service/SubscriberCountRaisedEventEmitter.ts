import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { IYoutubeDataApiV3, SubscriberCountRaisedEvent } from "../types";
import { YoutubeDataApiV3 } from "../infrastructure/YoutubeDataApiV3";
import { SubscriberCountManager } from "./SubscriberCountManager";
import { SubscriberCount } from "../core/SubscriberCount";
import { PollingInterval } from "../core/PollingInterval";
import { SafePollingInterval } from "../core/SafePollingInterval";
import { ChannelId } from "../core/ChannelId";
import { ChannelTitle } from "../core/ChannelTitle";
import { YoutubeApiKeyCredential } from "../core/YoutubeApiKeyCredential";
import { YoutubeApiReturnsError } from "../core/YoutubeApiReturnsError";

export class SubscriberCountRaisedEventEmitter extends (EventEmitter as new () => TypedEmitter<SubscriberCountRaisedEvent>) {
  readonly #channelId: ChannelId;
  readonly #interval: PollingInterval;
  readonly #youtubeDataApi: IYoutubeDataApiV3;
  #subscriberCountManager?: SubscriberCountManager;
  #isActivated: boolean;
  constructor(
    channelId: ChannelId,
    interval: PollingInterval,
    youtubeDataApi: IYoutubeDataApiV3
  ) {
    super();

    this.#channelId = channelId;
    this.#interval = interval;
    this.#youtubeDataApi = youtubeDataApi;
    this.#isActivated = false;
  }
  static init(channelId: string, interval: number, credential: string) {
    return new this(
      new ChannelId(channelId),
      new SafePollingInterval(interval),
      new YoutubeDataApiV3(new YoutubeApiKeyCredential(credential))
    );
  }

  async #getSubscriberCount(): Promise<SubscriberCount | undefined> {
    try {
      const json = await this.#youtubeDataApi.channels(this.#channelId);

      return new SubscriberCount(
        this.#channelId,
        new ChannelTitle(json.items[0].snippet.title),
        Number(json.items[0].statistics.subscriberCount)
      );
    } catch (err) {
      if (err instanceof YoutubeApiReturnsError) {
        this.emit("error", err);
      } else {
        this.emit(
          "error",
          new Error("Failed to get subscriber count via YouTube channels API.")
        );
      }
    }
  }

  async #execute() {
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
      this.emit("raised", currentSubscribeCount, nextSubscriberCount);
    }
    setTimeout(this.#execute.bind(this), this.#interval.value);
  }

  async start(): Promise<Boolean> {
    if (this.#isActivated) {
      return true;
    }

    const initialSubscriberCount = await this.#getSubscriberCount();
    if (initialSubscriberCount === undefined) {
      return false;
    }

    this.#subscriberCountManager = new SubscriberCountManager(
      initialSubscriberCount
    );

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
