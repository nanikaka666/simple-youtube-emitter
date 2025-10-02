import { ChannelId, PageFetcher, VideoId } from "youtube-live-scraper";
import { ClosestLiveVideoIdFetcher } from "../../src/service/ClosestLiveVideoIdFetcher";

afterEach(() => {
  jest.clearAllMocks();
});

describe("get", () => {
  test("get video id correctly.", async () => {
    jest
      .spyOn(PageFetcher, "getLivePage")
      .mockImplementation(
        jest.fn(() =>
          Promise.resolve({ type: "video", videoId: new VideoId("VVVVVVVVVVV") }),
        ) as jest.Mock,
      );

    expect(await ClosestLiveVideoIdFetcher.get(new ChannelId("@example"))).toEqual(
      new VideoId("VVVVVVVVVVV"),
    );
  });

  test("if the channel has no upcoming live or streaming live, undefined will be returned.", async () => {
    jest
      .spyOn(PageFetcher, "getLivePage")
      .mockImplementation(jest.fn(() => Promise.resolve({ type: "channel" })) as jest.Mock);

    expect(await ClosestLiveVideoIdFetcher.get(new ChannelId("@example"))).toEqual(undefined);
  });

  test("if an exception was thrown during fetch, the exception will be thrown as it.", () => {
    jest.spyOn(PageFetcher, "getLivePage").mockImplementation(
      jest.fn(() => {
        throw new Error("some reason");
      }) as jest.Mock,
    );

    expect(
      async () => await ClosestLiveVideoIdFetcher.get(new ChannelId("@example")),
    ).rejects.toThrow(new Error("some reason"));
  });
});
