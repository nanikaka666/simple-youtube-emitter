import { SubscriberCountRaisedEventEmitter } from "../../src/service/SubscriberCountRaisedEventEmitter";
import type { SubscriberCountFetcher } from "../../src/types";
import { SafePollingInterval } from "../../src/core/SafePollingInterval";
import { YoutubeApiReturnsError } from "../../src/core/YoutubeApiReturnsError";
import { SubscriberCount } from "../../src/core/SubscriberCount";
import { ChannelId } from "youtube-live-scraper";

class FakeSubscriberCountFetcher implements SubscriberCountFetcher {
  readonly #values: number[];
  #calledNum: number;
  constructor(values: number[]) {
    this.#values = values;
    this.#calledNum = 0;
  }
  async get(channelId: ChannelId) {
    return Promise.resolve(new SubscriberCount(channelId, this.#values[this.#calledNum++]));
  }
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe("Start events", () => {
  test("'start' event will be fired correctly.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new FakeSubscriberCountFetcher([0]),
    );

    const onStart = jest.fn();
    emitter.on("start", onStart);

    expect(await emitter.start()).toEqual(true);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  test("if start() called multiple times, extra 'start' event will not be fired.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new FakeSubscriberCountFetcher([0]),
    );

    const onStart = jest.fn();
    emitter.on("start", onStart);

    await emitter.start();
    expect(onStart).toHaveBeenCalledTimes(1); // check before second start() called.

    expect(await emitter.start()).toEqual(true); // second call.
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  test("if subscriber count couldn't get correctly at starting, 'start' event will not be fired.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new (class implements SubscriberCountFetcher {
        get(_: ChannelId): Promise<SubscriberCount> {
          throw new Error();
        }
      })(),
    );

    const onStart = jest.fn();
    emitter.on("start", onStart);
    emitter.on("error", jest.fn()); // to avoid Unhandled error.

    expect(await emitter.start()).toEqual(false);
    expect(onStart).toHaveBeenCalledTimes(0);
  });
});

describe("Raised events", () => {
  test("'raised' event will be fired correctly.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new FakeSubscriberCountFetcher([0, 5, 1, 3, 6]),
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
      new SubscriberCount(new ChannelId("@ChannelId"), 0),
      new SubscriberCount(new ChannelId("@ChannelId"), 5),
    );
    expect(onRaised).toHaveBeenNthCalledWith(
      2,
      new SubscriberCount(new ChannelId("@ChannelId"), 5),
      new SubscriberCount(new ChannelId("@ChannelId"), 6),
    );
  });
});

describe("End events", () => {
  test("'end' event will be fired correctly.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new FakeSubscriberCountFetcher([0]),
    );

    const onEnd = jest.fn();
    emitter.on("end", onEnd);

    await emitter.start();
    expect(onEnd).toHaveBeenCalledTimes(0); // check before close() call.
    emitter.close();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("'end' event will be not fired, before starting.", () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new FakeSubscriberCountFetcher([0]),
    );

    const onEnd = jest.fn();
    emitter.on("end", onEnd);

    emitter.close();
    expect(onEnd).toHaveBeenCalledTimes(0);
  });

  test("Extra close method call will not fire 'end' event.", async () => {
    const emitter = new SubscriberCountRaisedEventEmitter(
      new ChannelId("@ChannelId"),
      new SafePollingInterval(10 * 1000),
      new FakeSubscriberCountFetcher([0]),
    );

    const onEnd = jest.fn();
    emitter.on("end", onEnd);

    await emitter.start();
    emitter.close();
    expect(onEnd).toHaveBeenCalledTimes(1);

    emitter.close(); // second call.
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});

describe("Error events", () => {
  test.each([new YoutubeApiReturnsError("some reason"), new Error("some reason")])(
    "if an exception was thrown during get subscriber count, 'error' event will be fired.",
    async (exception) => {
      const emitter = new SubscriberCountRaisedEventEmitter(
        new ChannelId("@ChannelId"),
        new SafePollingInterval(10 * 1000),
        new (class implements SubscriberCountFetcher {
          get(_: ChannelId): Promise<SubscriberCount> {
            throw exception;
          }
        })(),
      );

      const onError = jest.fn();
      emitter.on("error", onError);

      await emitter.start();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(exception);
    },
  );
});
