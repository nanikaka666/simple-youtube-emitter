import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import fetch from "node-fetch";
import { parse } from "node-html-parser";
import { argv } from "process";

type SimpleYoutubeEvent = {
  subs: (old: number, latest: number) => void;
  fav: (old: number, latest: number) => void;
  start: () => void;
  end: () => void;
  error: (err: Error) => void;
};

interface VideoStatistics {
  likeCount: string;
}

interface VideoSnippet {
  title: string;
}

interface VideoApiResponse {
  items: [{ snippet: VideoSnippet; statistics: VideoStatistics }];
}

class SimpleYoutubeEventEmitter extends (EventEmitter as new () => TypedEmitter<SimpleYoutubeEvent>) {
  private async getVideoId(channelId: string): Promise<string | undefined> {
    const livePageUrl = `https://www.youtube.com/${channelId}/live`;
    const response = await fetch(livePageUrl);
    const body = await response.text();
    const parsedBody = parse(body);
    const element = parsedBody.querySelector('link[rel="shortlinkUrl"]');
    if (element === null) {
      this.emit(
        "error",
        new Error(
          `Given channel ${channelId} doesn't have streaming or upcoming live.`
        )
      );
      return undefined;
    }

    const href = element.getAttribute("href");
    if (href === undefined) {
      this.emit(
        "error",
        new Error(
          "<link> element doesn't have href. Youtube DOM maybe changed."
        )
      );
      return undefined;
    }

    const matchResult = href.match(/https:\/\/youtu.be\/(.+)/);

    if (matchResult === null) {
      this.emit(
        "error",
        new Error("Content of href attribute is maybe changed.")
      );
      return undefined;
    }

    return matchResult.at(1);
  }

  async watch(
    channelId: string,
    intervalMilliSeconds: number
  ): Promise<Boolean> {
    try {
      const videoApiUrl = "https://www.googleapis.com/youtube/v3/videos";
      const videoId = await this.getVideoId(channelId);
      if (videoId === undefined) {
        return false;
      }
      const query = new URLSearchParams({
        id: videoId,
        key: credential,
        part: ["snippet", "statistics"].join(","),
      });
      const url = `${videoApiUrl}?${query}`;

      const res = await fetch(url);
      const json = (await res.json()) as VideoApiResponse;

      console.log(json);
      console.log(json.items[0].snippet.title);
      console.log(json.items[0].statistics.likeCount);

      this.emit("start");
      return true;
    } catch (err: unknown) {
      console.log(err);
      this.emit("error", new Error("Begining of watch is failed."));
      return false;
    }
  }
}

const credential = argv[2];
console.log(credential);

const channelId = argv[3];
console.log("ChannelId: ", channelId);

const simple = new SimpleYoutubeEventEmitter();
simple.on("error", (err) => {
  console.log(err.message);
});
simple.on("start", () => console.log("started!!"));
simple.watch(channelId, 5);
