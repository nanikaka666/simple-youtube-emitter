import { VideoId } from "youtube-live-scraper";
import { YoutubeApiKeyCredential } from "../../../src/core/YoutubeApiKeyCredential";
import { YoutubeDataApiV3Client } from "../../../src/service/YoutubeDataApiV3Client";
import { LikeCount } from "../../../src/core/LikeCount";
import { YoutubeApiReturnsError } from "../../../src/core/YoutubeApiReturnsError";
import { LikeCountFetcherViaYoutubeDataApi } from "../../../src/service/likeCount/LikeCountFetcherViaYoutubeDataApi";

afterEach(() => {
  jest.clearAllMocks();
});

describe("get", () => {
  test("get like count correctly.", async () => {
    jest.spyOn(YoutubeDataApiV3Client, "getLikeCount").mockResolvedValue(888);

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

  test("if the channel set like count invisible, undefined will be returned.", async () => {
    jest.spyOn(YoutubeDataApiV3Client, "getLikeCount").mockResolvedValue(undefined);

    const fetcher = new LikeCountFetcherViaYoutubeDataApi(
      new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
    );

    expect(await fetcher.get(new VideoId("VVVVVVVVVVV"))).toEqual(undefined);
  });

  test("if an exception was thrown by V3Client, the exception will be thrown as it.", () => {
    jest
      .spyOn(YoutubeDataApiV3Client, "getLikeCount")
      .mockRejectedValue(new YoutubeApiReturnsError("some reason"));

    const fetcher = new LikeCountFetcherViaYoutubeDataApi(
      new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
    );

    expect(async () => await fetcher.get(new VideoId("VVVVVVVVVVV"))).rejects.toThrow(
      new YoutubeApiReturnsError("some reason"),
    );
  });
});
