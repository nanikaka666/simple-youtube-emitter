import { VideoId } from "youtube-live-scraper";
import { YoutubeApiKeyCredential } from "../../src/core/YoutubeApiKeyCredential";
import { LikeCountFetcherViaYoutubeDataApi } from "../../src/service/LikeCountFetcherViaYoutubeDataApi";
import { YoutubeDataApiV3Client } from "../../src/service/YoutubeDataApiV3Client";
import { LikeCount } from "../../src/core/LikeCount";
import { YoutubeApiReturnsError } from "../../src/core/YoutubeApiReturnsError";

afterEach(() => {
  jest.clearAllMocks();
});

describe("get", () => {
  test("get like count correctly.", async () => {
    jest
      .spyOn(YoutubeDataApiV3Client, "getLikeCount")
      .mockImplementation(jest.fn(() => Promise.resolve(888)));

    const fetcher = new LikeCountFetcherViaYoutubeDataApi(
      new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
    );

    expect(await fetcher.get(new VideoId("VVVVVVVVVVV"))).toEqual(
      new LikeCount(new VideoId("VVVVVVVVVVV"), 888),
    );

    expect(YoutubeDataApiV3Client.getLikeCount).toHaveBeenCalledTimes(1);
    expect(YoutubeDataApiV3Client.getLikeCount).toHaveBeenCalledWith(
      new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
      new VideoId("VVVVVVVVVVV"),
    );
  });

  test("if an exception was thrown by V3Client, the exception will be thrown as it.", () => {
    jest.spyOn(YoutubeDataApiV3Client, "getLikeCount").mockImplementation(
      jest.fn(() => {
        throw new YoutubeApiReturnsError("some reason");
      }),
    );

    const fetcher = new LikeCountFetcherViaYoutubeDataApi(
      new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
    );

    expect(async () => await fetcher.get(new VideoId("VVVVVVVVVVV"))).rejects.toThrow(
      new YoutubeApiReturnsError("some reason"),
    );
  });
});
