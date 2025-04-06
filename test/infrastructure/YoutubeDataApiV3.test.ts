import { VideoId } from "../../src/core/VideoId";
import { YoutubeApiKeyCredential } from "../../src/core/YoutubeApiKeyCredential";
import { YoutubeDataApiV3 } from "../../src/infrastructure/YoutubeDataApiV3";
import { ChannelApiResponse, VideoApiResponse } from "../../src/types";
import { YoutubeApiReturnsError } from "../../src/core/YoutubeApiReturnsError";
import { ChannelId } from "../../src/core/ChannelId";

describe("videos", () => {
  beforeEach(() => {
    jest.spyOn(global, "fetch").mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              items: [
                {
                  snippet: {
                    title: "mock title",
                  },
                  statistics: {
                    likeCount: "8",
                  },
                },
              ],
            } satisfies VideoApiResponse),
        })
      ) as jest.Mock
    );
  });
  afterEach(() => jest.clearAllMocks());
  test("confirm that request url and queries are expected.", async () => {
    const api = new YoutubeDataApiV3(
      new YoutubeApiKeyCredential("aaaaabbbbbcccccdddddeeeeefffffggggg1234")
    );
    const videoId = new VideoId("abcdefghijk");

    await api.videos(videoId);

    const url = new URL(jest.mocked(fetch).mock.calls.at(0)!.toString());

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(url.origin).toBe("https://www.googleapis.com");
    expect(url.pathname).toBe("/youtube/v3/videos");
    expect(url.search).toContain("id=abcdefghijk");
    expect(url.search).toContain("key=aaaaabbbbbcccccdddddeeeeefffffggggg1234");
  });

  test("correctly fetched data.", async () => {
    const api = new YoutubeDataApiV3(
      new YoutubeApiKeyCredential("aaaaabbbbbcccccdddddeeeeefffffggggg1234")
    );
    const videoId = new VideoId("abcdefghijk");

    expect(await api.videos(videoId)).toEqual({
      items: [
        {
          snippet: {
            title: "mock title",
          },
          statistics: {
            likeCount: "8",
          },
        },
      ],
    } satisfies VideoApiResponse);
  });

  test("throw specific error, when youtube api returns value including error.", async () => {
    jest.spyOn(global, "fetch").mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              error: {},
            }),
        })
      ) as jest.Mock
    );
    const api = new YoutubeDataApiV3(
      new YoutubeApiKeyCredential("aaaaabbbbbcccccdddddeeeeefffffggggg1234")
    );
    const videoId = new VideoId("abcdefghijk");

    expect(api.videos(videoId)).rejects.toThrow(YoutubeApiReturnsError);
  });
});

describe("channels", () => {
  beforeEach(() => {
    jest.spyOn(global, "fetch").mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              items: [
                {
                  snippet: {
                    title: "mock title",
                  },
                  statistics: {
                    subscriberCount: "8",
                  },
                },
              ],
            } satisfies ChannelApiResponse),
        })
      ) as jest.Mock
    );
  });
  afterEach(() => jest.clearAllMocks());
  test("confirm that request url and queries are expected. case handle", async () => {
    const api = new YoutubeDataApiV3(
      new YoutubeApiKeyCredential("aaaaabbbbbcccccdddddeeeeefffffggggg1234")
    );
    const channelId = new ChannelId("@test");

    await api.channels(channelId);

    const url = new URL(jest.mocked(fetch).mock.calls.at(0)!.toString());

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(url.origin).toBe("https://www.googleapis.com");
    expect(url.pathname).toBe("/youtube/v3/channels");
    expect(url.search).toContain("forHandle=%40test");
    expect(url.search).toContain("key=aaaaabbbbbcccccdddddeeeeefffffggggg1234");
  });

  test("confirm that request url and queries are expected. case not handle.", async () => {
    const api = new YoutubeDataApiV3(
      new YoutubeApiKeyCredential("aaaaabbbbbcccccdddddeeeeefffffggggg1234")
    );
    const channelId = new ChannelId("testtesttesttesttesttest");

    await api.channels(channelId);

    const url = new URL(jest.mocked(fetch).mock.calls.at(0)!.toString());

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(url.origin).toBe("https://www.googleapis.com");
    expect(url.pathname).toBe("/youtube/v3/channels");
    expect(url.search).toContain("id=testtesttesttesttesttest");
    expect(url.search).toContain("key=aaaaabbbbbcccccdddddeeeeefffffggggg1234");
  });

  test("correctly fetched data.", async () => {
    const api = new YoutubeDataApiV3(
      new YoutubeApiKeyCredential("aaaaabbbbbcccccdddddeeeeefffffggggg1234")
    );
    const channelId = new ChannelId("@test");

    expect(await api.channels(channelId)).toEqual({
      items: [
        {
          snippet: {
            title: "mock title",
          },
          statistics: {
            subscriberCount: "8",
          },
        },
      ],
    } satisfies ChannelApiResponse);
  });
  test("throw specific error, when youtube api returns value including error.", async () => {
    jest.spyOn(global, "fetch").mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              error: {},
            }),
        })
      ) as jest.Mock
    );
    const api = new YoutubeDataApiV3(
      new YoutubeApiKeyCredential("aaaaabbbbbcccccdddddeeeeefffffggggg1234")
    );
    const channelId = new ChannelId("@test");

    expect(api.channels(channelId)).rejects.toThrow(YoutubeApiReturnsError);
  });
});
