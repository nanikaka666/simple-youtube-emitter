import { ChannelId } from "youtube-live-scraper";
import { CountBase } from "./CountBase";

export class SubscriberCount extends CountBase {
  readonly channelId: ChannelId;
  constructor(channelId: ChannelId, value: number) {
    super(value);
    this.channelId = channelId;
  }
  check(nextSubscriberCount: SubscriberCount) {
    if (this.channelId !== nextSubscriberCount.channelId) {
      throw new Error(`Different channelId is detected.`);
    }
    return this.value < nextSubscriberCount.value;
  }
}
