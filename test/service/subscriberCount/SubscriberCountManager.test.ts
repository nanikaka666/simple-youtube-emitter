import { ChannelId } from "youtube-live-scraper";
import { SubscriberCount } from "../../../src/core/SubscriberCount";
import { SubscriberCountManager } from "../../../src/service/subscriberCount/SubscriberCountManager";

const channelId = new ChannelId("@example");

describe("constructor", () => {
  test("initialized with input parameter.", () => {
    const manager = new SubscriberCountManager(new SubscriberCount(channelId, 10));
    expect(manager.get()).toEqual(new SubscriberCount(channelId, 10));
  });
});

describe("update", () => {
  test("update sucdessfully.", () => {
    const manager = new SubscriberCountManager(new SubscriberCount(channelId, 10));

    expect(manager.update(new SubscriberCount(channelId, 20))).toBe(true);
    expect(manager.get()).toEqual(new SubscriberCount(channelId, 20));
  });
  test("in the case not need to update, nothing to happen.", () => {
    const manager = new SubscriberCountManager(new SubscriberCount(channelId, 10));

    expect(manager.update(new SubscriberCount(channelId, 5))).toBe(false);
    expect(manager.get()).toEqual(new SubscriberCount(channelId, 10));
  });
  test("if compare to different videoId, an exception will be thrown.", () => {
    const manager = new SubscriberCountManager(new SubscriberCount(channelId, 10));

    expect(() => manager.update(new SubscriberCount(new ChannelId("@another"), 20))).toThrow();
  });
});

describe("get", () => {
  test("best like count will be returned.", () => {
    const manager = new SubscriberCountManager(new SubscriberCount(channelId, 0));

    [10, 15, 12, 10, 13, 20, 18].forEach((count) =>
      manager.update(new SubscriberCount(channelId, count)),
    );
    expect(manager.get()).toEqual(new SubscriberCount(channelId, 20));
  });
});
