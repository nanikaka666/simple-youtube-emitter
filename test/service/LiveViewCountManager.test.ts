import { VideoId } from "youtube-live-scraper";
import { LiveViewCountManager } from "../../src/service/LiveViewCountManager";
import { LiveViewCount } from "../../src/core/LiveViewCount";

const videoId = new VideoId("abcdefghijk");

describe("constructor", () => {
  test("like count is set 0, even if init parammeter has positive like count.", () => {
    const manager = new LiveViewCountManager(new LiveViewCount(videoId, 100));
    expect(manager.get()).toEqual(new LiveViewCount(videoId, 0));
  });
});

describe("update", () => {
  test("update sucdessfully.", () => {
    const initialLikeCount = new LiveViewCount(videoId, 100);
    const manager = new LiveViewCountManager(initialLikeCount);

    expect(manager.update(initialLikeCount)).toBe(true);
    expect(manager.get()).toEqual(initialLikeCount);
  });
  test("in the case not need to update, nothing to happen.", () => {
    const initialLikeCount = new LiveViewCount(videoId, 0);
    const manager = new LiveViewCountManager(initialLikeCount);

    expect(manager.update(initialLikeCount)).toBe(false);
    expect(manager.get()).toEqual(initialLikeCount);
  });
  test("if compare to different videoId, an exception will be thrown.", () => {
    const initialLikeCount = new LiveViewCount(videoId, 0);
    const manager = new LiveViewCountManager(initialLikeCount);

    expect(() => manager.update(new LiveViewCount(new VideoId("ABCDEFGHIJK"), 10))).toThrow();
  });
});

describe("get", () => {
  test("best like count will be returned.", () => {
    const manager = new LiveViewCountManager(new LiveViewCount(videoId, 0));

    [10, 15, 12, 10, 13, 20, 18].forEach((count) =>
      manager.update(new LiveViewCount(videoId, count)),
    );
    expect(manager.get()).toEqual(new LiveViewCount(videoId, 20));
  });
});
