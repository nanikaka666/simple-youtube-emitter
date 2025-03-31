import { ChannelId } from "./ChannelId";
import { CountBase } from "./CountBase";

export class SubscriberCount extends CountBase {
  readonly channelId: ChannelId;
  readonly channelTitle: string;
  constructor(channelId: ChannelId, channelTitle: string, value: number) {
    super(value);
    this.channelId = channelId;
    this.channelTitle = channelTitle;
  }
  check(nextSubscriberCount: SubscriberCount) {
    if (this.channelId !== nextSubscriberCount.channelId) {
      throw new Error(`Different channelId is detected.`);
    }
    return this.value < nextSubscriberCount.value;
  }
}
