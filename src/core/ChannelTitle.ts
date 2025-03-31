export class ChannelTitle {
  readonly title: string;
  constructor(title: string) {
    if (title === "") {
      throw new Error("Channel title is empty.");
    }
    // this threshold has no evidence, but based on common sense.
    if (title.length > 100) {
      throw new Error("Channel title is too long.");
    }
    this.title = title;
  }
}
