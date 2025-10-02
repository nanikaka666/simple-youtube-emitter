import { ChannelId, ChannelTitle, VideoId, VideoTitle } from "youtube-live-scraper";
import { YoutubeDataApiWithScraping } from "../../src/infrastructure/YoutubeDataApiWithScraping";
import { ChannelApiResponse, VideoApiResponse } from "../../src/types";
import { PageFetcher, Scraper } from "youtube-live-scraper";

afterEach(() => {
  jest.clearAllMocks();
});

describe("videos", () => {
  beforeEach(() => {
    jest
      .spyOn(PageFetcher, "getVideoPage")
      .mockImplementation(jest.fn(() => Promise.resolve({ type: "video" })) as jest.Mock);
  });

  test.each([
    [229, "Video Title 1", 123, "229", "123"],
    [undefined, "Video Title 2", 0, "0", "0"],
  ])(
    "get data successfully.",
    async (
      inputLikeCount,
      videoTitle,
      inputLiveViewCount,
      expectedLikeCount,
      expectedLiveViewCount,
    ) => {
      jest.spyOn(Scraper, "getLikeCount").mockReturnValue(inputLikeCount);
      jest.spyOn(Scraper, "getVideoTitle").mockReturnValue(new VideoTitle(videoTitle));
      jest.spyOn(Scraper, "getLiveViewCount").mockReturnValue(inputLiveViewCount);

      const videoId = new VideoId("VVVVVVVVVVV");

      expect(await YoutubeDataApiWithScraping.videos(videoId)).toEqual({
        items: [
          {
            snippet: { title: videoTitle },
            statistics: { likeCount: expectedLikeCount },
            liveStreamingDetails: { concurrentViewers: expectedLiveViewCount },
          },
        ],
      } satisfies VideoApiResponse);
    },
  );
});

describe("channels", () => {
  beforeEach(() => {
    jest
      .spyOn(PageFetcher, "getChannelPage")
      .mockImplementation(jest.fn(() => Promise.resolve({ type: "channel" })) as jest.Mock);
  });

  test("return subscriber count successfully.", async () => {
    jest
      .spyOn(Scraper, "getChannelTitleFromChannelPage")
      .mockReturnValue(new ChannelTitle("Channel Name"));
    jest.spyOn(Scraper, "getSubscriberCountFromChannelPage").mockReturnValue(1750);

    const channelId = new ChannelId("@TestId");
    const res = await YoutubeDataApiWithScraping.channels(channelId);
    expect(res).toEqual({
      items: [
        {
          snippet: { title: "Channel Name" },
          statistics: { subscriberCount: "1750" },
        },
      ],
    } satisfies ChannelApiResponse);
  });
});
