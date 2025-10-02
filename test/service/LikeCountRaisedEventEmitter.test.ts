import { LikeCountRaisedEventEmitter } from "../../src/service/LikeCountRaisedEventEmitter";
import type { LikeCountFetcher } from "../../src/types";
import { SafePollingInterval } from "../../src/core/SafePollingInterval";
import { LikeCount } from "../../src/core/LikeCount";
import { YoutubeApiReturnsError } from "../../src/core/YoutubeApiReturnsError";
import { ChannelId, VideoId, VideoTitle } from "youtube-live-scraper";
import { ClosestLiveVideoIdFetcher } from "../../src/service/ClosestLiveVideoIdFetcher";

class FakeLikeCountFetcher implements LikeCountFetcher {
  readonly #values: (number | undefined)[];
  #calledNum: number;
  constructor(values: (number | undefined)[]) {
    this.#values = values;
    this.#calledNum = 0;
  }
  get(videoId: VideoId): Promise<LikeCount | undefined> {
    const val = this.#values[this.#calledNum++];
    if (val === undefined) {
      return Promise.resolve(undefined);
    } else {
      return Promise.resolve(new LikeCount(videoId, new VideoTitle("Video Title"), val));
    }
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
  test("Start event will be fired correctly.", async () => {
    jest
      .spyOn(ClosestLiveVideoIdFetcher, "get")
      .mockImplementation(jest.fn(() => Promise.resolve(new VideoId("VVVVVVVVVVV"))));

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeLikeCountFetcher([0]),
    );

    const onStart = jest.fn();
    emitter.on("start", onStart);

    expect(await emitter.start()).toEqual(true);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  test("if start() called multiple times, extra 'start' event will not be fired.", async () => {
    jest
      .spyOn(ClosestLiveVideoIdFetcher, "get")
      .mockImplementation(jest.fn(() => Promise.resolve(new VideoId("VVVVVVVVVVV"))));

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeLikeCountFetcher([0]),
    );

    const onStart = jest.fn();
    emitter.on("start", onStart);

    await emitter.start();
    expect(onStart).toHaveBeenCalledTimes(1); // check called times before extra method call.

    await emitter.start(); // extra method call.
    expect(onStart).toHaveBeenCalledTimes(1); // called times will be not increased.
  });

  test("if the channel has no upcoming live or streaming live, 'start' event will not be fired.", async () => {
    jest
      .spyOn(ClosestLiveVideoIdFetcher, "get")
      .mockImplementation(jest.fn(() => Promise.resolve(undefined)));

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeLikeCountFetcher([0]),
    );

    const onStart = jest.fn();
    emitter.on("start", onStart);
    emitter.on("error", jest.fn()); // to avoid Unhandled error.

    expect(await emitter.start()).toEqual(false);
    expect(onStart).toHaveBeenCalledTimes(0);
  });

  test("if an exception was thrown during fetch live video id, 'start' event will not be fired.", async () => {
    jest.spyOn(ClosestLiveVideoIdFetcher, "get").mockImplementation(
      jest.fn(() => {
        throw new Error();
      }),
    );

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeLikeCountFetcher([0]),
    );

    const onStart = jest.fn();
    emitter.on("start", onStart);
    emitter.on("error", jest.fn()); // to avoid Unhandled error.

    expect(await emitter.start()).toEqual(false);
    expect(onStart).toHaveBeenCalledTimes(0);
  });

  test("if the channel set like count invisible, 'start' event will not be fired.", async () => {
    jest
      .spyOn(ClosestLiveVideoIdFetcher, "get")
      .mockImplementation(jest.fn(() => Promise.resolve(new VideoId("VVVVVVVVVVV"))));

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeLikeCountFetcher([undefined]),
    );

    const onStart = jest.fn();
    emitter.on("start", onStart);

    expect(await emitter.start()).toEqual(false);
    expect(onStart).toHaveBeenCalledTimes(0);
  });

  test.each([new Error(), new YoutubeApiReturnsError()])(
    "if an exception was thrown during fetch like count, 'start' event will not be fired.",
    async (exception) => {
      jest
        .spyOn(ClosestLiveVideoIdFetcher, "get")
        .mockImplementation(jest.fn(() => Promise.resolve(new VideoId("VVVVVVVVVVV"))));

      const emitter = new LikeCountRaisedEventEmitter(
        new ChannelId("@channelId"),
        new SafePollingInterval(10 * 1000),
        new (class implements LikeCountFetcher {
          get(_: VideoId): Promise<LikeCount | undefined> {
            throw exception;
          }
        })(),
      );

      const onStart = jest.fn();
      emitter.on("start", onStart);
      emitter.on("error", jest.fn()); // to avoid Unhandled error.

      expect(await emitter.start()).toEqual(false);
      expect(onStart).toHaveBeenCalledTimes(0);
    },
  );
});

describe("Raised events", () => {
  test("Raised event will be fired correctly.", async () => {
    jest
      .spyOn(ClosestLiveVideoIdFetcher, "get")
      .mockImplementation(jest.fn(() => Promise.resolve(new VideoId("VVVVVVVVVVV"))));

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeLikeCountFetcher([0, 5, 1, 3, 6]), // this sequence fire raised event two times.
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
      new LikeCount(new VideoId("VVVVVVVVVVV"), new VideoTitle("Video Title"), 0),
      new LikeCount(new VideoId("VVVVVVVVVVV"), new VideoTitle("Video Title"), 5),
    );
    expect(onRaised).toHaveBeenNthCalledWith(
      2,
      new LikeCount(new VideoId("VVVVVVVVVVV"), new VideoTitle("Video Title"), 5),
      new LikeCount(new VideoId("VVVVVVVVVVV"), new VideoTitle("Video Title"), 6),
    );
  });
});

describe("End events", () => {
  test("End event will be fired correctly.", async () => {
    jest
      .spyOn(ClosestLiveVideoIdFetcher, "get")
      .mockImplementation(jest.fn(() => Promise.resolve(new VideoId("VVVVVVVVVVV"))));

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeLikeCountFetcher([0]),
    );

    const onEnd = jest.fn();
    emitter.on("end", onEnd);

    await emitter.start();
    expect(onEnd).toHaveBeenCalledTimes(0); // check called times before method call.
    emitter.close();
    expect(onEnd).toHaveBeenCalledTimes(1); // end event fired.
  });

  test("End event will be not fired before starting.", () => {
    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeLikeCountFetcher([]),
    );

    const onEnd = jest.fn();
    emitter.on("end", onEnd);

    emitter.close();
    expect(onEnd).toHaveBeenCalledTimes(0); // before starting, end events are never fired.
  });

  test("if close() called multiple times, extra 'end' event will be not fired.", async () => {
    jest
      .spyOn(ClosestLiveVideoIdFetcher, "get")
      .mockImplementation(jest.fn(() => Promise.resolve(new VideoId("VVVVVVVVVVV"))));

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeLikeCountFetcher([0]),
    );

    const onEnd = jest.fn();
    emitter.on("end", onEnd);

    await emitter.start();
    emitter.close();
    expect(onEnd).toHaveBeenCalledTimes(1); // end event fired.

    emitter.close();
    expect(onEnd).toHaveBeenCalledTimes(1); // extra end event is never fired.
  });
});

describe("Error events", () => {
  test("if the channel doesn't have streaming or upcoming live, 'error' event will be fired", async () => {
    jest
      .spyOn(ClosestLiveVideoIdFetcher, "get")
      .mockImplementation(jest.fn(() => Promise.resolve(undefined)));

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeLikeCountFetcher([0]),
    );

    const onError = jest.fn();
    emitter.on("error", onError);

    await emitter.start();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  test("if an exception was thrown during fetch live video id, 'error' event will be fired.", async () => {
    jest.spyOn(ClosestLiveVideoIdFetcher, "get").mockImplementation(
      jest.fn(() => {
        throw new Error("some reason");
      }),
    );

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeLikeCountFetcher([0]),
    );

    const onError = jest.fn();
    emitter.on("error", onError);

    await emitter.start();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(new Error("some reason"));
  });

  test.each([new Error("some reason"), new YoutubeApiReturnsError("some reason")])(
    "if an exception was thrown during fetch like count, 'error' event will be fired.",
    async (exception) => {
      jest
        .spyOn(ClosestLiveVideoIdFetcher, "get")
        .mockImplementation(jest.fn(() => Promise.resolve(new VideoId("VVVVVVVVVVV"))));

      const emitter = new LikeCountRaisedEventEmitter(
        new ChannelId("@channelId"),
        new SafePollingInterval(10 * 1000),
        new (class implements LikeCountFetcher {
          get(_: VideoId): Promise<LikeCount | undefined> {
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
