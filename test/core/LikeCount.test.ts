import { VideoId } from "youtube-live-scraper";
import { LikeCount } from "../../src/core/LikeCount";

const validVideoId = new VideoId("abcdefghijk");

const anotherValidVideoId = new VideoId("ABCDEFGHIJK");

describe("constructor", () => {
  test.each([0, Number.MAX_SAFE_INTEGER])("valid value will be instanced.", (inputValue) => {
    const actual = new LikeCount(validVideoId, inputValue);
    expect(actual.videoId).toBe(validVideoId);
    expect(actual.value).toBe(inputValue);
  });

  test("negative value is not allowed.", () => {
    expect(() => new LikeCount(validVideoId, -1)).toThrow();
  });

  test("too large value is not allowed.", () => {
    expect(() => new LikeCount(validVideoId, Number.MAX_SAFE_INTEGER + 1)).toThrow();
  });
});

describe("check", () => {
  const current = new LikeCount(validVideoId, 10);

  test("when next like count is greater than current, return true", () => {
    const next = new LikeCount(validVideoId, 11);
    expect(current.check(next)).toBe(true);
  });

  test("when next like count is less than current, return false", () => {
    const next = new LikeCount(validVideoId, 9);
    expect(current.check(next)).toBe(false);
  });

  test("when next like count is equal to current, return false", () => {
    const next = new LikeCount(validVideoId, 10);
    expect(current.check(next)).toBe(false);
  });

  test("if try to check one having different videoId, an exception is throwed", () => {
    const next = new LikeCount(anotherValidVideoId, 10);
    expect(() => current.check(next)).toThrow();
  });
});
