import { LikeCount } from "../../src/core/LikeCount";
import { VideoId } from "../../src/core/VideoId";
import { VideoTitle } from "../../src/core/VideoTitle";
import { LikeCountManager } from "../../src/service/LikeCountManager";

const videoId = new VideoId("abcdefghijk");
const videoTitle = new VideoTitle("video title");

describe("constructor", () => {
  test("like count is set 0, even if init parammeter has positive like count.", () => {
    const manager = new LikeCountManager(
      new LikeCount(videoId, videoTitle, 100)
    );
    expect(manager.get()).toEqual(new LikeCount(videoId, videoTitle, 0));
  });
});

describe("update", () => {
  test("update sucdessfully.", () => {
    const initialLikeCount = new LikeCount(videoId, videoTitle, 100);
    const manager = new LikeCountManager(initialLikeCount);

    expect(manager.update(initialLikeCount)).toBe(true);
    expect(manager.get()).toEqual(initialLikeCount);
  });
  test("in the case not need to update, nothing to happen.", () => {
    const initialLikeCount = new LikeCount(videoId, videoTitle, 0);
    const manager = new LikeCountManager(initialLikeCount);

    expect(manager.update(initialLikeCount)).toBe(false);
    expect(manager.get()).toEqual(initialLikeCount);
  });
  test("if compare to different videoId, an exception will be thrown.", () => {
    const initialLikeCount = new LikeCount(videoId, videoTitle, 0);
    const manager = new LikeCountManager(initialLikeCount);

    expect(() =>
      manager.update(
        new LikeCount(
          new VideoId("ABCDEFGHIJK"),
          new VideoTitle("another title"),
          10
        )
      )
    ).toThrow();
  });
});

describe("get", () => {
  test("best like count will be returned.", () => {
    const manager = new LikeCountManager(new LikeCount(videoId, videoTitle, 0));

    [10, 15, 12, 10, 13, 20, 18].forEach((count) =>
      manager.update(new LikeCount(videoId, videoTitle, count))
    );
    expect(manager.get()).toEqual(new LikeCount(videoId, videoTitle, 20));
  });
});
