import { LikeCount } from "../../src/core/LikeCount";
import { VideoId } from "../../src/core/VideoId";
import { VideoTitle } from "../../src/core/VideoTitle";

const validVideoId = new VideoId("abcdefghijk");
const validVideoTitle = new VideoTitle("Valid Title");

const anotherValidVideoId = new VideoId("ABCDEFGHIJK");
const anotherVideoTitle = new VideoTitle("another title");

describe("constructor", () => {
  test.each([0, Number.MAX_SAFE_INTEGER])("valid value will be instanced.", (inputValue) => {
    const actual = new LikeCount(validVideoId, validVideoTitle, inputValue);
    expect(actual.videoId).toBe(validVideoId);
    expect(actual.videoTitle).toBe(validVideoTitle);
    expect(actual.value).toBe(inputValue);
  });

  test("negative value is not allowed.", () => {
    expect(() => new LikeCount(validVideoId, validVideoTitle, -1)).toThrow();
  });

  test("too large value is not allowed.", () => {
    expect(
      () => new LikeCount(validVideoId, validVideoTitle, Number.MAX_SAFE_INTEGER + 1),
    ).toThrow();
  });
});

describe("check", () => {
  const current = new LikeCount(validVideoId, validVideoTitle, 10);

  test("when next like count is greater than current, return true", () => {
    const next = new LikeCount(validVideoId, validVideoTitle, 11);
    expect(current.check(next)).toBe(true);
  });

  test("when next like count is less than current, return false", () => {
    const next = new LikeCount(validVideoId, validVideoTitle, 9);
    expect(current.check(next)).toBe(false);
  });

  test("when next like count is equal to current, return false", () => {
    const next = new LikeCount(validVideoId, validVideoTitle, 10);
    expect(current.check(next)).toBe(false);
  });

  test("if try to check one having different videoId, an exception is throwed", () => {
    const next = new LikeCount(anotherValidVideoId, validVideoTitle, 10);
    expect(() => current.check(next)).toThrow();
  });

  test("checking to one having different videoTitle does not throw an exception.", () => {
    const next = new LikeCount(validVideoId, anotherVideoTitle, 11);
    expect(current.check(next)).toBe(true);
  });
});
