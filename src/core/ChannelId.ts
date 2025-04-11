export class ChannelId {
  readonly id: string;
  readonly isHandle: boolean;
  constructor(id: string) {
    if (id === "") {
      throw new Error("channelId is empty.");
    }
    if (id.length > 30) {
      throw new Error("Too long channelId. Or YouTube changed format channelId.");
    }
    const isHandle = id.startsWith("@");
    if (!isHandle && id.match(/^[0-9a-zA-Z_-]{24}$/) === null) {
      throw new Error(
        "channelId looks like not YouTube handle has invalid format. Or YouTube changed format channelId.",
      );
    }

    this.id = id;
    this.isHandle = isHandle;
  }
}
