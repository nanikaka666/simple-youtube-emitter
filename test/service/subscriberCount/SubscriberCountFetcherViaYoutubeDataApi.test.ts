import { ChannelId } from "youtube-live-scraper";
import { YoutubeApiKeyCredential } from "../../../src/core/YoutubeApiKeyCredential";
import { YoutubeDataApiV3Client } from "../../../src/service/YoutubeDataApiV3Client";
import { SubscriberCount } from "../../../src/core/SubscriberCount";
import { YoutubeApiReturnsError } from "../../../src/core/YoutubeApiReturnsError";
import { SubscriberCountFetcherViaYoutubeDataApi } from "../../../src/service/subscriberCount/SubscriberCountFetcherViaYoutubeDataApi";

afterEach(() => {
  jest.clearAllMocks();
});

describe("get", () => {
  test("get SubscriberCount correctly.", async () => {
    jest
      .spyOn(YoutubeDataApiV3Client, "getSubscriberCount")
      .mockImplementation(jest.fn(() => Promise.resolve(11100)));

    const fetcher = new SubscriberCountFetcherViaYoutubeDataApi(
      new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
    );

    expect(await fetcher.get(new ChannelId("@example"))).toEqual(
      new SubscriberCount(new ChannelId("@example"), 11100),
    );

    expect(YoutubeDataApiV3Client.getSubscriberCount).toHaveBeenCalledTimes(1);
    expect(YoutubeDataApiV3Client.getSubscriberCount).toHaveBeenCalledWith(
      new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
      new ChannelId("@example"),
    );
  });

  test("if an exception was thrown during api connection, the exception will be thrown as it.", () => {
    jest.spyOn(YoutubeDataApiV3Client, "getSubscriberCount").mockImplementation(
      jest.fn(() => {
        throw new YoutubeApiReturnsError("some reason");
      }),
    );

    const fetcher = new SubscriberCountFetcherViaYoutubeDataApi(
      new YoutubeApiKeyCredential("credentialcredentialcredentialcredentia"),
    );

    expect(async () => await fetcher.get(new ChannelId("@example"))).rejects.toThrow(
      new YoutubeApiReturnsError("some reason"),
    );
  });
});
