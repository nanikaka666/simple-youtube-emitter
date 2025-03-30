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
  videoId: string;
  videoTitle: string;
  likeCount: number;
}

interface VideoStatisticsResponse {
  likeCount: string;
}

interface VideoSnippetResponse {
  title: string;
}

interface VideoApiResponse {
  items: [
    { snippet: VideoSnippetResponse; statistics: VideoStatisticsResponse }
  ];
}

class SimpleYoutubeEventEmitter extends (EventEmitter as new () => TypedEmitter<SimpleYoutubeEvent>) {
  private async getVideoId(channelId: string): Promise<string | undefined> {
    const livePageUrl =
      channelId.charAt(0) === "@"
        ? `https://www.youtube.com/${channelId}/live`
        : `https://www.youtube.com/channel/${channelId}/live`;
    const response = await fetch(livePageUrl);
    const body = await response.text();
    const parsedBody = parse(body);
    // console.log(body);
    const element = parsedBody.querySelector('link[rel="canonical"]');
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

    const matchResult = href.match(
      /https:\/\/www\.youtube\.com\/watch\?v=(.+)/
    );

    if (matchResult === null) {
      this.emit(
        "error",
        new Error(
          "This channel has no live-streaming or upcoming live, or content of href attribute is maybe changed."
        )
      );
      return undefined;
    }

    return matchResult.at(1);
  }

  private async getVideoStatistics(videoId: string): Promise<VideoStatistics> {
    const videoApiUrl = "https://www.googleapis.com/youtube/v3/videos";
    const query = new URLSearchParams({
      id: videoId,
      key: credential,
      part: ["snippet", "statistics"].join(","),
    });
    const url = `${videoApiUrl}?${query}`;

    const res = await fetch(url);
    const json = (await res.json()) as VideoApiResponse;

    return {
      videoId: videoId,
      videoTitle: json.items[0].snippet.title,
      likeCount: Number(json.items[0].statistics.likeCount),
    };
  }

  async watch(
    channelId: string,
    intervalMilliSeconds: number
  ): Promise<Boolean> {
    try {
      const videoId = await this.getVideoId(channelId);
      if (videoId === undefined) {
        return false;
      }
      const videoStatistics = await this.getVideoStatistics(videoId);
      console.log(videoStatistics);

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
