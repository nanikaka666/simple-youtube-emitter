import { ChannelId } from "youtube-live-scraper";
import { SubscriberCount } from "../../src/core/SubscriberCount";

const validChannelId = new ChannelId("@validvalidvalidvalidval");

describe("constructor", () => {
  test.each([0, Number.MAX_SAFE_INTEGER])("valid value will be instanced.", (inputValue) => {
    const actual = new SubscriberCount(validChannelId, inputValue);
    expect(actual.channelId).toBe(validChannelId);
    expect(actual.value).toBe(inputValue);
  });

  test("negative value is invalid.", () => {
    expect(() => new SubscriberCount(validChannelId, -1)).toThrow();
  });

  test("too large value is invalid.", () => {
    expect(() => new SubscriberCount(validChannelId, Number.MAX_SAFE_INTEGER + 1)).toThrow();
  });
});

describe("check", () => {
  const current = new SubscriberCount(validChannelId, 10);
  test("when next like count is greater than current, return true", () => {
    const next = new SubscriberCount(validChannelId, 11);
    expect(current.check(next)).toBe(true);
  });
  test("when next like count is less than current, return false", () => {
    const next = new SubscriberCount(validChannelId, 9);
    expect(current.check(next)).toBe(false);
  });
  test("when next like count is equal to current, return false", () => {
    const next = new SubscriberCount(validChannelId, 10);
    expect(current.check(next)).toBe(false);
  });
  test("if try to check one having different channelId, an exception is throwed.", () => {
    const next = new SubscriberCount(new ChannelId("@VALIDVALIDVALIDVALIDVAL"), 11);
    expect(() => current.check(next)).toThrow();
  });
});
