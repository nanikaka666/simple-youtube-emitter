import { ChannelId } from "../../src/core/ChannelId";
import { ChannelTitle } from "../../src/core/ChannelTitle";
import { SubscriberCount } from "../../src/core/SubscriberCount";

const validChannelId = new ChannelId("@validvalidvalidvalidval");
const validChannelTitle = new ChannelTitle("valid title");

describe("constructor", () => {
  test.each([0, Number.MAX_SAFE_INTEGER])("valid value will be instanced.", (inputValue) => {
    const actual = new SubscriberCount(validChannelId, validChannelTitle, inputValue);
    expect(actual.channelId).toBe(validChannelId);
    expect(actual.channelTitle).toBe(validChannelTitle);
    expect(actual.value).toBe(inputValue);
  });

  test("negative value is invalid.", () => {
    expect(() => new SubscriberCount(validChannelId, validChannelTitle, -1)).toThrow();
  });

  test("too large value is invalid.", () => {
    expect(
      () => new SubscriberCount(validChannelId, validChannelTitle, Number.MAX_SAFE_INTEGER + 1),
    ).toThrow();
  });
});

describe("check", () => {
  const current = new SubscriberCount(validChannelId, validChannelTitle, 10);
  test("when next like count is greater than current, return true", () => {
    const next = new SubscriberCount(validChannelId, validChannelTitle, 11);
    expect(current.check(next)).toBe(true);
  });
  test("when next like count is less than current, return false", () => {
    const next = new SubscriberCount(validChannelId, validChannelTitle, 9);
    expect(current.check(next)).toBe(false);
  });
  test("when next like count is equal to current, return false", () => {
    const next = new SubscriberCount(validChannelId, validChannelTitle, 10);
    expect(current.check(next)).toBe(false);
  });
  test("if try to check one having different channelId, an exception is throwed.", () => {
    const next = new SubscriberCount(
      new ChannelId("@VALIDVALIDVALIDVALIDVAL"),
      validChannelTitle,
      11,
    );
    expect(() => current.check(next)).toThrow();
  });
  test("checking to one having different channelTitle does not throw an exception.", () => {
    const next = new SubscriberCount(validChannelId, new ChannelTitle("another title"), 11);
    expect(current.check(next)).toBe(true);
  });
});
