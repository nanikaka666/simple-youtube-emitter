import { ChannelId, ChannelTitle, VideoId, VideoTitle } from "youtube-live-scraper";
import {
  LikeCountUnavailableError,
  YoutubeDataApiWithScraping,
} from "../../src/service/YoutubeDataApiWithScraping";
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

  test("return like count successfully.", async () => {
    jest.spyOn(Scraper, "getLikeCount").mockReturnValue(229);
    jest.spyOn(Scraper, "getVideoTitle").mockReturnValue(new VideoTitle("Video Title"));
    jest.spyOn(Scraper, "getLiveViewCount").mockReturnValue(0);

    const videoId = new VideoId("VVVVVVVVVVV");

    const res = await YoutubeDataApiWithScraping.videos(videoId);
    expect(res).toEqual({
      items: [
        {
          snippet: { title: "Video Title" },
          statistics: { likeCount: "229" },
          liveStreamingDetails: { concurrentViewers: "0" },
        },
      ],
    } satisfies VideoApiResponse);
  });

  test("when like count is unavailable, because of the video's config, then an exception will be thrown.", () => {
    jest.spyOn(Scraper, "getLikeCount").mockReturnValue(undefined);
    jest.spyOn(Scraper, "getLiveViewCount").mockReturnValue(0);

    const videoId = new VideoId("VVVVVVVVVVV");

    expect(async () => {
      await YoutubeDataApiWithScraping.videos(videoId);
    }).rejects.toThrow(LikeCountUnavailableError);
  });
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
