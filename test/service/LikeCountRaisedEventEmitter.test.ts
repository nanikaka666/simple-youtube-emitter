import { LikeCountRaisedEventEmitter } from "../../src/service/LikeCountRaisedEventEmitter";
import type {
  ChannelApiResponse,
  IFetchPage,
  IYoutubeDataApiV3,
  VideoApiResponse,
} from "../../src/types";
import { ChannelId } from "../../src/core/ChannelId";
import { SafePollingInterval } from "../../src/core/SafePollingInterval";
import { VideoId } from "../../src/core/VideoId";
import { LikeCount } from "../../src/core/LikeCount";
import { VideoTitle } from "../../src/core/VideoTitle";
import { YoutubeApiReturnsError } from "../../src/core/YoutubeApiReturnsError";

class FakeFetch implements IFetchPage {
  fetchAsString(_url: string): Promise<string> {
    return Promise.resolve(`
<html>
    <head>
        <link rel="canonical" href="https://www.youtube.com/watch?v=VVVVVVVVVVV"/>
    </head>
    <body></body>
</html>`);
  }
}

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
  test("Start event will be fired correctly.", async () => {
    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0, 1]),
      new FakeFetch(),
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
      new FakeFetch(),
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
  test("Raised event will be fired correctly.", async () => {
    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0, 5, 1, 3, 6]), // this sequence fire raised event two times.
      new FakeFetch(),
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
  test("End event will be fired correctly.", async () => {
    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
      new FakeFetch(),
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
      new FakeFetch(),
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
      new FakeFetch(),
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
    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
      new (class implements IFetchPage {
        fetchAsString(_url: string): Promise<string> {
          // <link rel="canonical"> tag is missing.
          return Promise.resolve(`
            <html>
                <head>
                </head>
                <body></body>
            </html>`);
        }
      })(),
    );

    const onError = jest.fn();
    emitter.on("error", onError);

    expect(await emitter.start()).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  test("if link rel tag don't have href attributea, error event will be fired.", async () => {
    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
      new (class implements IFetchPage {
        fetchAsString(_url: string): Promise<string> {
          // <link rel="canonical"> tag is missing.
          return Promise.resolve(`
            <html>
                <head>
                    <link rel="canonical"/>
                </head>
                <body></body>
            </html>`);
        }
      })(),
    );

    const onError = jest.fn();
    emitter.on("error", onError);

    expect(await emitter.start()).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  test("if href attribute has odd video url, error event will be fired.", async () => {
    const emitter = new LikeCountRaisedEventEmitter(
      new ChannelId("@channelId"),
      new SafePollingInterval(10 * 1000),
      new FakeYoutubeApi([0]),
      new (class implements IFetchPage {
        fetchAsString(_url: string): Promise<string> {
          // <link rel="canonical"> tag is missing.
          return Promise.resolve(`
            <html>
                <head>
                    <link rel="canonical" href="https://www.youtube.com/watch/v/VVVVVVVVVVV"/>
                </head>
                <body></body>
            </html>`);
        }
      })(),
    );

    const onError = jest.fn();
    emitter.on("error", onError);

    expect(await emitter.start()).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  test("if youtube API returns error response, error event will be fired.", async () => {
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
      new FakeFetch(),
    );

    const onError = jest.fn();
    emitter.on("error", onError);

    expect(await emitter.start()).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  test("if videos method returns error response, error event will be fired.", async () => {
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
      new FakeFetch(),
    );

    const onError = jest.fn();
    emitter.on("error", onError);

    expect(await emitter.start()).toBe(false);
    expect(onError).toHaveBeenCalled();
  });
});
