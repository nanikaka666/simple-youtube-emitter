import { ChannelId, VideoId } from "youtube-live-scraper";
import { YoutubeApiKeyCredential } from "../../src/core/YoutubeApiKeyCredential";
import * as fetch from "../../src/infrastructure/fetch";
import { YoutubeDataApiV3Client } from "../../src/service/YoutubeDataApiV3Client";
import { YoutubeApiReturnsError } from "../../src/core/YoutubeApiReturnsError";

afterEach(() => {
  jest.clearAllMocks();
});

describe("getLikeCount", () => {
  test("like count correctly fetched.", async () => {
    jest.spyOn(fetch, "fetchAsJson").mockResolvedValue({
      items: [
        {
          statistics: {
            likeCount: "180",
          },
        },
      ],
    });

    expect(
      await YoutubeDataApiV3Client.getLikeCount(
        new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
        new VideoId("VVVVVVVVVVV"),
      ),
    ).toEqual(180);

    expect(fetch.fetchAsJson).toHaveBeenCalledTimes(1);

    const passedUrl = jest.mocked(fetch.fetchAsJson).mock.calls.at(0)![0];

    expect(passedUrl).toContain("https://www.googleapis.com/youtube/v3/videos");
    expect(passedUrl).toContain("id=VVVVVVVVVVV");
    expect(passedUrl).toContain("key=credentialcredentialcredentialcredentia");
    expect(passedUrl).toContain("part=statistics");
  });

  test("if like count key not founded, `undefined` will be returned.", async () => {
    jest.spyOn(fetch, "fetchAsJson").mockResolvedValue({
      items: [
        {
          statistics: {},
        },
      ],
    });

    expect(
      await YoutubeDataApiV3Client.getLikeCount(
        new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
        new VideoId("VVVVVVVVVVV"),
      ),
    ).toEqual(undefined);
  });

  test("if Youtube API returned error json, an exception will be thrown.", () => {
    jest.spyOn(fetch, "fetchAsJson").mockResolvedValue({
      error: "some reason",
    });

    expect(
      async () =>
        await YoutubeDataApiV3Client.getLikeCount(
          new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
          new VideoId("VVVVVVVVVVV"),
        ),
    ).rejects.toThrow(new YoutubeApiReturnsError(`{"error":"some reason"}`));
  });
});

describe("getLiveViewCount", () => {
  test("live view count correctly fetched.", async () => {
    jest.spyOn(fetch, "fetchAsJson").mockReturnValue(
      Promise.resolve({
        items: [
          {
            liveStreamingDetails: {
              concurrentViewers: "333",
            },
          },
        ],
      }),
    );

    expect(
      await YoutubeDataApiV3Client.getLiveViewCount(
        new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
        new VideoId("VVVVVVVVVVV"),
      ),
    ).toEqual(333);

    expect(fetch.fetchAsJson).toHaveBeenCalledTimes(1);

    const passedUrl = jest.mocked(fetch.fetchAsJson).mock.calls.at(0)![0];

    expect(passedUrl).toContain("https://www.googleapis.com/youtube/v3/videos");
    expect(passedUrl).toContain("id=VVVVVVVVVVV");
    expect(passedUrl).toContain("key=credentialcredentialcredentialcredentia");
    expect(passedUrl).toContain("part=liveStreamingDetails");
  });

  test("if Youtube API returned error json, an exception will be thrown.", () => {
    jest.spyOn(fetch, "fetchAsJson").mockReturnValue(
      Promise.resolve({
        error: "some reason",
      }),
    );

    expect(
      async () =>
        await YoutubeDataApiV3Client.getLiveViewCount(
          new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
          new VideoId("VVVVVVVVVVV"),
        ),
    ).rejects.toThrow(new YoutubeApiReturnsError(`{"error":"some reason"}`));
  });
});

describe("getSubscriberCount", () => {
  test("subscriber count correctly fetched, with Youtube Handle style", async () => {
    jest.spyOn(fetch, "fetchAsJson").mockReturnValue(
      Promise.resolve({
        items: [
          {
            statistics: {
              subscriberCount: "123000",
            },
          },
        ],
      }),
    );

    expect(
      await YoutubeDataApiV3Client.getSubscriberCount(
        new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
        new ChannelId("@example"),
      ),
    ).toEqual(123000);

    expect(fetch.fetchAsJson).toHaveBeenCalledTimes(1);

    const passedUrl = jest.mocked(fetch.fetchAsJson).mock.calls.at(0)![0];

    expect(passedUrl).toContain("https://www.googleapis.com/youtube/v3/channels");
    expect(passedUrl).toContain("forHandle=%40example");
    expect(passedUrl).toContain("key=credentialcredentialcredentialcredentia");
    expect(passedUrl).toContain("part=statistics");
  });

  test("subscriber count correctly fetched, with non Youtube Handle style", async () => {
    jest.spyOn(fetch, "fetchAsJson").mockReturnValue(
      Promise.resolve({
        items: [
          {
            statistics: {
              subscriberCount: "123000",
            },
          },
        ],
      }),
    );

    expect(
      await YoutubeDataApiV3Client.getSubscriberCount(
        new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
        new ChannelId("exampleexampleexampleexa"),
      ),
    ).toEqual(123000);

    expect(fetch.fetchAsJson).toHaveBeenCalledTimes(1);

    const passedUrl = jest.mocked(fetch.fetchAsJson).mock.calls.at(0)![0];

    expect(passedUrl).toContain("https://www.googleapis.com/youtube/v3/channels");
    expect(passedUrl).toContain("id=exampleexampleexampleexa");
    expect(passedUrl).toContain("key=credentialcredentialcredentialcredentia");
    expect(passedUrl).toContain("part=statistics");
  });

  test("if Youtube API returned error json, an exception will be thrown.", () => {
    jest.spyOn(fetch, "fetchAsJson").mockReturnValue(
      Promise.resolve({
        error: "some reason",
      }),
    );

    expect(
      async () =>
        await YoutubeDataApiV3Client.getSubscriberCount(
          new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
          new ChannelId("exampleexampleexampleexa"),
        ),
    ).rejects.toThrow(new YoutubeApiReturnsError(`{"error":"some reason"}`));
  });
});
