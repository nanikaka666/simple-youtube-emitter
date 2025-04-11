import { SubscriberCountRaisedEventEmitter } from "../../src/service/SubscriberCountRaisedEventEmitter";
import type { ChannelApiResponse, IYoutubeDataApiV3, VideoApiResponse } from "../../src/types";
import { ChannelId } from "../../src/core/ChannelId";
import { SafePollingInterval } from "../../src/core/SafePollingInterval";
import { VideoId } from "../../src/core/VideoId";
import { YoutubeApiReturnsError } from "../../src/core/YoutubeApiReturnsError";
import { SubscriberCount } from "../../src/core/SubscriberCount";
import { ChannelTitle } from "../../src/core/ChannelTitle";

class FakeYoutubeApi implements IYoutubeDataApiV3 {
  #channelsCalled: number;
  readonly #returnSubscriberCountArray: number[];
  constructor(subscriberCountArray: number[]) {
    this.#channelsCalled = 0;
    this.#returnSubscriberCountArray = [...subscriberCountArray];
  }
  videos(videoId: VideoId): Promise<VideoApiResponse> {
    return Promise.resolve({
      items: [
        {
          snippet: { title: "" },
          statistics: {
            likeCount: "0",
          },
        },
      ],
    });
  }
  channels(channelId: ChannelId): Promise<ChannelApiResponse> {
    return Promise.resolve({
      items: [
        {
          snippet: { title: "channel title" },
          statistics: {
            subscriberCount: String(
              this.#returnSubscriberCountArray[
                this.#channelsCalled++ % this.#returnSubscriberCountArray.length
              ],
            ),
          },
        },
      ],
    });
  }
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("Start events", () => {
  test("Start event will be fired correctly.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
    );

    const onStart = jest.fn();
    emitter.on("start", onStart);

    expect(await emitter.start()).toBe(true);
    expect(onStart).toHaveBeenCalled();
  });

  test("Extra start method call will not fire start event.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
    );

    const onStart = jest.fn();
    emitter.on("start", onStart);

    await emitter.start();
    expect(onStart).toHaveBeenCalled();

    expect(await emitter.start()).toBe(true);
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

describe("Raised events", () => {
  test("Raised event will be fired correctly.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0, 5, 1, 3, 6]),
    );

    const onRaised = jest.fn();
    emitter.on("raised", onRaised);

    await emitter.start();
    await jest.advanceTimersToNextTimerAsync();
    await jest.advanceTimersToNextTimerAsync();
    await jest.advanceTimersToNextTimerAsync();
    await jest.advanceTimersToNextTimerAsync();

    expect(onRaised).toHaveBeenCalledTimes(2);
    expect(onRaised).toHaveBeenNthCalledWith(
      1,
      new SubscriberCount(new ChannelId("@ChannelId"), new ChannelTitle("channel title"), 0),
      new SubscriberCount(new ChannelId("@ChannelId"), new ChannelTitle("channel title"), 5),
    );
    expect(onRaised).toHaveBeenNthCalledWith(
      2,
      new SubscriberCount(new ChannelId("@ChannelId"), new ChannelTitle("channel title"), 5),
      new SubscriberCount(new ChannelId("@ChannelId"), new ChannelTitle("channel title"), 6),
    );
  });
});

describe("End events", () => {
  test("End event will be fired correctly.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
    );

    const onEnd = jest.fn();
    emitter.on("end", onEnd);

    await emitter.start();
    emitter.close();
    expect(onEnd).toHaveBeenCalled();
  });

  test("End event will be not fired, before starting.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
    );

    const onEnd = jest.fn();
    emitter.on("end", onEnd);

    emitter.close();
    expect(onEnd).toHaveBeenCalledTimes(0);
  });

  test("Extra close method call will not fire end event.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
    );

    const onEnd = jest.fn();
    emitter.on("end", onEnd);

    await emitter.start();
    emitter.close();
    expect(onEnd).toHaveBeenCalled();

    emitter.close();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});

describe("Error events", () => {
  test("If youtube API returns error response, error event will be fired.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new (class implements IYoutubeDataApiV3 {
        videos(videoId: VideoId): Promise<VideoApiResponse> {
          return Promise.resolve({
            items: [
              {
                snippet: { title: "" },
                statistics: {
                  likeCount: "0",
                },
              },
            ],
          });
        }
        channels(channelId: ChannelId): Promise<ChannelApiResponse> {
          throw new YoutubeApiReturnsError();
        }
      })(),
    );

    const onError = jest.fn();
    emitter.on("error", onError);

    expect(await emitter.start()).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  test("If channels method returns error response, error event will be fired.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new (class implements IYoutubeDataApiV3 {
        videos(videoId: VideoId): Promise<VideoApiResponse> {
          return Promise.resolve({
            items: [
              {
                snippet: { title: "" },
                statistics: {
                  likeCount: "0",
                },
              },
            ],
          });
        }
        channels(channelId: ChannelId): Promise<ChannelApiResponse> {
          throw new Error();
        }
      })(),
    );

    const onError = jest.fn();
    emitter.on("error", onError);

    expect(await emitter.start()).toBe(false);
    expect(onError).toHaveBeenCalled();
  });
});
