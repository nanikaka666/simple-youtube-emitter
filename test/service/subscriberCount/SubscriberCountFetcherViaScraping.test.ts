import { ChannelId, PageFetcher, Scraper } from "youtube-live-scraper";
import { SubscriberCount } from "../../../src/core/SubscriberCount";
import { SubscriberCountFetcherViaScraping } from "../../../src/service/subscriberCount/SubscriberCountFetcherViaScraping";

afterEach(() => {
  jest.clearAllMocks();
});

describe("get", () => {
  test("get SubscriberCount correctly.", async () => {
    jest
      .spyOn(PageFetcher, "getChannelPage")
      .mockImplementation(jest.fn(() => Promise.resolve({ type: "channel" })) as jest.Mock);

    jest.spyOn(Scraper, "getSubscriberCountFromChannelPage").mockReturnValue(12300);

    expect(await SubscriberCountFetcherViaScraping.get(new ChannelId("@example"))).toEqual(
      new SubscriberCount(new ChannelId("@example"), 12300),
    );
  });

  test("if an exception was thrown during scraping, the exception will be thrown as it.", () => {
    jest.spyOn(PageFetcher, "getChannelPage").mockImplementation(
      jest.fn(() => {
        throw new Error("some reason");
      }),
    );

    expect(
      async () => await SubscriberCountFetcherViaScraping.get(new ChannelId("@example")),
    ).rejects.toThrow(new Error("some reason"));
  });
});
