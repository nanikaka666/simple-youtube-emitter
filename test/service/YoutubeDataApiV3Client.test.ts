import { VideoId } from "youtube-live-scraper";
import { YoutubeApiKeyCredential } from "../../src/core/YoutubeApiKeyCredential";
import * as fetch from "../../src/infrastructure/fetch";
import { YoutubeDataApiV3Client } from "../../src/service/YoutubeDataApiV3Client";
import { YoutubeApiReturnsError } from "../../src/core/YoutubeApiReturnsError";

afterEach(() => {
  jest.clearAllMocks();
});

describe("getLikeCount", () => {
  test("like count correctly fetched.", async () => {
    jest.spyOn(fetch, "fetchAsJson").mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          items: [
            {
              statistics: {
                likeCount: "180",
              },
            },
          ],
        }),
      ),
    );

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

  test("if Youtube API returned error json, an exception will be thrown.", () => {
    jest.spyOn(fetch, "fetchAsJson").mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          error: "some reason",
        }),
      ),
    );

    expect(
      async () =>
        await YoutubeDataApiV3Client.getLikeCount(
          new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
          new VideoId("VVVVVVVVVVV"),
        ),
    ).rejects.toThrow(new YoutubeApiReturnsError(`{"error":"some reason"}`));
  });
});
