import { LikeCountRaisedEventEmitter } from "../../src/service/LikeCountRaisedEventEmitter";
import type { ChannelApiResponse, IYoutubeDataApiV3, VideoApiResponse } from "../../src/types";
import { SafePollingInterval } from "../../src/core/SafePollingInterval";
import { LikeCount } from "../../src/core/LikeCount";
import { YoutubeApiReturnsError } from "../../src/core/YoutubeApiReturnsError";
import { ChannelId, PageFetcher, VideoId, VideoTitle } from "youtube-live-scraper";

class FakeYoutubeApi implements IYoutubeDataApiV3 {
  #videosCalled: number;
  readonly #returnLikeCountArray: number[];
  constructor(likeCountArray: number[]) {
    this.#videosCalled = 0;
    this.#returnLikeCountArray = [...likeCountArray];
  }
  videos(_videoId: VideoId): Promise<VideoApiResponse> {
    return Promise.resolve({
      items: [
        {
          snippet: { title: "video title" },
          statistics: {
            likeCount: String(
              this.#returnLikeCountArray[this.#videosCalled++ % this.#returnLikeCountArray.length],
            ),
          },
        },
      ],
    });
  }
  channels(_channelId: ChannelId): Promise<ChannelApiResponse> {
    return Promise.resolve({
      items: [
        {
          snippet: { title: "" },
          statistics: { subscriberCount: "0" },
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
  beforeEach(() => {
    jest
      .spyOn(PageFetcher, "getLivePage")
      .mockImplementation(
        jest.fn(() =>
          Promise.resolve({ type: "video", videoId: new VideoId("VVVVVVVVVVV") }),
        ) as jest.Mock,
      );
  });
  test("Start event will be fired correctly.", async () => {
    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0, 1]),
    );

    const onStart = jest.fn();
    emitter.on("start", onStart);

    expect(await emitter.start()).toBe(true);
    expect(onStart).toHaveBeenCalled();
  });

  test("extra start method call.", async () => {
    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0, 1]),
    );

    const onStart = jest.fn();
    emitter.on("start", onStart);

    await emitter.start();
    expect(onStart).toHaveBeenCalledTimes(1); // start event is fired

    await emitter.start(); // extra call
    expect(onStart).toHaveBeenCalledTimes(1); // extra start event is not fired
  });
});

describe("Raised events", () => {
  beforeEach(() => {
    jest
      .spyOn(PageFetcher, "getLivePage")
      .mockImplementation(
        jest.fn(() =>
          Promise.resolve({ type: "video", videoId: new VideoId("VVVVVVVVVVV") }),
        ) as jest.Mock,
      );
  });

  test("Raised event will be fired correctly.", async () => {
    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0, 5, 1, 3, 6]), // this sequence fire raised event two times.
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
      new LikeCount(new VideoId("VVVVVVVVVVV"), new VideoTitle("video title"), 0),
      new LikeCount(new VideoId("VVVVVVVVVVV"), new VideoTitle("video title"), 5),
    );
    expect(onRaised).toHaveBeenNthCalledWith(
      2,
      new LikeCount(new VideoId("VVVVVVVVVVV"), new VideoTitle("video title"), 5),
      new LikeCount(new VideoId("VVVVVVVVVVV"), new VideoTitle("video title"), 6),
    );
  });
});

describe("End events", () => {
  beforeEach(() => {
    jest
      .spyOn(PageFetcher, "getLivePage")
      .mockImplementation(
        jest.fn(() =>
          Promise.resolve({ type: "video", videoId: new VideoId("VVVVVVVVVVV") }),
        ) as jest.Mock,
      );
  });
  test("End event will be fired correctly.", async () => {
    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
    );

    const onEnd = jest.fn();
    emitter.on("end", onEnd);

    await emitter.start();
    emitter.close();
    expect(onEnd).toHaveBeenCalledTimes(1); // end event fired.
  });

  test("End event will be not fired before starting.", () => {
    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
    );

    const onEnd = jest.fn();
    emitter.on("end", onEnd);

    emitter.close();
    expect(onEnd).toHaveBeenCalledTimes(0); // before starting, end events are never fired.
  });

  test("extra end event will be not fired.", async () => {
    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
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
  test("The channel don't have streaming or upcoming live, error event will be fired", async () => {
    jest
      .spyOn(PageFetcher, "getLivePage")
      .mockImplementation(jest.fn(() => Promise.resolve({ type: "channel" })) as jest.Mock);

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
    );

    const onError = jest.fn();
    emitter.on("error", onError);

    expect(await emitter.start()).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  test("if fail to fetch live page, error event will be fired.", async () => {
    jest.spyOn(PageFetcher, "getLivePage").mockImplementation(
      jest.fn(() => {
        throw new Error();
      }) as jest.Mock,
    );

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
    );

    const onError = jest.fn();
    emitter.on("error", onError);

    expect(await emitter.start()).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  test("if youtube API returns error response, error event will be fired.", async () => {
    jest
      .spyOn(PageFetcher, "getLivePage")
      .mockImplementation(
        jest.fn(() =>
          Promise.resolve({ type: "video", videoId: new VideoId("VVVVVVVVVVV") }),
        ) as jest.Mock,
      );

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new (class implements IYoutubeDataApiV3 {
        videos(_videoId: VideoId): Promise<VideoApiResponse> {
          throw new YoutubeApiReturnsError();
        }
        channels(_channelId: ChannelId): Promise<ChannelApiResponse> {
          return Promise.resolve({
            items: [
              {
                snippet: { title: "" },
                statistics: { subscriberCount: "0" },
              },
            ],
          });
        }
      })(),
    );

    const onError = jest.fn();
    emitter.on("error", onError);

    expect(await emitter.start()).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  test("if videos method returns error response, error event will be fired.", async () => {
    jest
      .spyOn(PageFetcher, "getLivePage")
      .mockImplementation(
        jest.fn(() =>
          Promise.resolve({ type: "video", videoId: new VideoId("VVVVVVVVVVV") }),
        ) as jest.Mock,
      );

    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new (class implements IYoutubeDataApiV3 {
        videos(_videoId: VideoId): Promise<VideoApiResponse> {
          throw new Error();
        }
        channels(_channelId: ChannelId): Promise<ChannelApiResponse> {
          return Promise.resolve({
            items: [
              {
                snippet: { title: "" },
                statistics: { subscriberCount: "0" },
              },
            ],
          });
        }
      })(),
    );

    const onError = jest.fn();
    emitter.on("error", onError);

    expect(await emitter.start()).toBe(false);
    expect(onError).toHaveBeenCalled();
  });
});
