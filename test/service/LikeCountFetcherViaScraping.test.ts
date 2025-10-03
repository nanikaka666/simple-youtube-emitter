import { PageFetcher, Scraper, VideoId } from "youtube-live-scraper";
import { LikeCountFetcherViaScraping } from "../../src/service/LikeCountFetcherViaScraping";
import { LikeCount } from "../../src/core/LikeCount";

afterEach(() => {
  jest.clearAllMocks();
});

describe("get", () => {
  test("get like count correctly.", async () => {
    jest
      .spyOn(PageFetcher, "getVideoPage")
      .mockImplementation(jest.fn(() => Promise.resolve({ type: "video" })) as jest.Mock);
    jest.spyOn(Scraper, "getLikeCount").mockReturnValue(12345);

    expect(await LikeCountFetcherViaScraping.get(new VideoId("VVVVVVVVVVV"))).toEqual(
      new LikeCount(new VideoId("VVVVVVVVVVV"), 12345),
    );
  });

  test("if the channel set like count invisible, undefined will be returned.", async () => {
    jest
      .spyOn(PageFetcher, "getVideoPage")
      .mockImplementation(jest.fn(() => Promise.resolve({ type: "video" })) as jest.Mock);
    jest.spyOn(Scraper, "getLikeCount").mockReturnValue(undefined);

    expect(await LikeCountFetcherViaScraping.get(new VideoId("VVVVVVVVVVV"))).toEqual(undefined);
  });

  test("if an exception was thrown during scraping, the exception will be thrown as it.", () => {
    jest.spyOn(PageFetcher, "getVideoPage").mockImplementation(
      jest.fn(() => {
        throw new Error("some reason");
      }),
    );

    expect(
      async () => await LikeCountFetcherViaScraping.get(new VideoId("VVVVVVVVVVV")),
    ).rejects.toThrow(new Error("some reason"));
  });
});
