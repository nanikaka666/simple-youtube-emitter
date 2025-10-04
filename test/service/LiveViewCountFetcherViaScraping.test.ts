import { PageFetcher, Scraper, VideoId } from "youtube-live-scraper";
import { LiveViewCountFetcherViaScraping } from "../../src/service/LiveViewCountFetcherViaScraping";
import { LiveViewCount } from "../../src/core/LiveViewCount";

afterEach(() => {
  jest.clearAllMocks();
});

describe("get", () => {
  test("get live view count correctly.", async () => {
    jest
      .spyOn(PageFetcher, "getVideoPage")
      .mockImplementation(jest.fn(() => Promise.resolve({ type: "video" })) as jest.Mock);
    jest.spyOn(Scraper, "getLiveViewCount").mockReturnValue(123);

    expect(await LiveViewCountFetcherViaScraping.get(new VideoId("VVVVVVVVVVV"))).toEqual(
      new LiveViewCount(new VideoId("VVVVVVVVVVV"), 123),
    );
  });

  test("if an exception was thrown during scraping, the exception will be thrown as it.", () => {
    jest.spyOn(PageFetcher, "getVideoPage").mockImplementation(
      jest.fn(() => {
        throw new Error("some reason");
      }),
    );

    expect(
      async () => await LiveViewCountFetcherViaScraping.get(new VideoId("VVVVVVVVVVV")),
    ).rejects.toThrow(new Error("some reason"));
  });
});
