export class VideoId {
  readonly id: string;
  constructor(id: string) {
    if (id.match(/^[0-9a-zA-Z_-]{11}$/) === null) {
      throw new Error("invalid format videoId.");
    }

    this.id = id;
  }
}
