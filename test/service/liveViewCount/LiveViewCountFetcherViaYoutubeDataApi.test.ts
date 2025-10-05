import { VideoId } from "youtube-live-scraper";
import { YoutubeApiKeyCredential } from "../../../src/core/YoutubeApiKeyCredential";
import { YoutubeDataApiV3Client } from "../../../src/service/YoutubeDataApiV3Client";
import { LiveViewCount } from "../../../src/core/LiveViewCount";
import { LiveViewCountFetcherViaYoutubeDataApi } from "../../../src/service/liveViewCount/LiveViewCountFetcherViaYoutubeDataApi";

afterEach(() => {
  jest.clearAllMocks();
});

describe("get", () => {
  test("get live view count correctly.", async () => {
    jest.spyOn(YoutubeDataApiV3Client, "getLiveViewCount").mockResolvedValue(123);

    const fetcher = new LiveViewCountFetcherViaYoutubeDataApi(
      new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
    );

    expect(await fetcher.get(new VideoId("VVVVVVVVVVV"))).toEqual(
      new LiveViewCount(new VideoId("VVVVVVVVVVV"), 123),
    );
    expect(YoutubeDataApiV3Client.getLiveViewCount).toHaveBeenCalledTimes(1);
    expect(YoutubeDataApiV3Client.getLiveViewCount).toHaveBeenCalledWith(
      new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
      new VideoId("VVVVVVVVVVV"),
    );
  });

  test("if live view count is set invisible, return undefined.", async () => {
    jest.spyOn(YoutubeDataApiV3Client, "getLiveViewCount").mockResolvedValue(undefined);

    const fetcher = new LiveViewCountFetcherViaYoutubeDataApi(
      new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
    );

    expect(await fetcher.get(new VideoId("VVVVVVVVVVV"))).toEqual(undefined);
  });

  test("if an exception was thrown during api connection, the exception will be thrown as it.", () => {
    jest
      .spyOn(YoutubeDataApiV3Client, "getLiveViewCount")
      .mockRejectedValue(new Error("some reason"));

    const fetcher = new LiveViewCountFetcherViaYoutubeDataApi(
      new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
    );

    expect(async () => await fetcher.get(new VideoId("VVVVVVVVVVV"))).rejects.toThrow(
      new Error("some reason"),
    );
  });
});
