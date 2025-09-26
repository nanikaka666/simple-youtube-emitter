import { ChannelId } from "../core/ChannelId";
import { VideoId } from "../core/VideoId";
import { ChannelApiResponse, IFetchPage, IYoutubeDataApiV3, VideoApiResponse } from "../types";
import { parse } from "node-html-parser";
import type { HTMLElement } from "node-html-parser";

export class LikeCountUnavailableError extends Error {}

export class YoutubeDataApiWithScraping implements IYoutubeDataApiV3 {
  readonly #fetch: IFetchPage;
  constructor(fetch: IFetchPage) {
    this.#fetch = fetch;
  }
  async videos(videoId: VideoId): Promise<VideoApiResponse> {
    const url = `https://www.youtube.com/watch?v=${videoId.id}`;
    const body = await this.#fetch.fetchAsString(url);

    const parsed = parse(body);
    const title = this.#extractVideoTitleFromHtmlElement(parsed);
    const likeCount = this.#extractLikeCountFromHtmlElement(parsed);

    if (!likeCount) {
      throw new LikeCountUnavailableError();
    }

    return {
      items: [
        {
          snippet: { title },
          statistics: { likeCount },
        },
      ],
    };
  }

  #extractVideoTitleFromHtmlElement(e: HTMLElement) {
    const titleTag = e.querySelector("meta[name='title']");
    if (!titleTag) {
      throw new Error("<meta name='title'> is missing.");
    }

    const title = titleTag.getAttribute("content");

    if (!title) {
      throw new Error("<meta name='title'> is not having 'content' attribute.");
    }

    return title;
  }

  #extractLikeCountFromHtmlElement(e: HTMLElement): string | undefined {
    const statisticTag = e.querySelector(
      "div[itemprop='interactionStatistic'] meta[content='https://schema.org/LikeAction']",
    );
    if (!statisticTag) {
      return undefined;
    }
    const likeCountTag = statisticTag.parentNode.querySelector(
      "meta[itemprop='userInteractionCount']",
    );
    if (!likeCountTag) {
      throw new Error("<meta itemprop='userInteractionCount'> is missing.");
    }
    const likeCount = likeCountTag.getAttribute("content");
    if (!likeCount) {
      throw new Error("<meta itemprop='userInteractionCount'> is not having 'content' attribute.");
    }

    return likeCount;
  }

  async channels(channelId: ChannelId): Promise<ChannelApiResponse> {
    const url = `https://www.youtube.com/${channelId.id}`;
    const page = await this.#fetch.fetchAsString(url);

    const title = this.#extractChannelTitleFromChannelPage(page);
    const subscriberCount = this.#extractSubscriberCountFromChannelPage(page);

    return {
      items: [
        {
          snippet: { title },
          statistics: { subscriberCount },
        },
      ],
    };
  }

  #extractChannelTitleFromChannelPage(page: string) {
    const t = page.match(/meta itemprop="name" content="(.+?)"/);
    if (!t) {
      throw new Error("<meta itemprop='name'> is missing.");
    }
    const title = t[1];

    return title;
  }

  #extractSubscriberCountFromChannelPage(page: string) {
    // the pattern matching is constructed for Japanese.
    const r = page.match(/チャンネル登録者数 (\d+\.?\d*)(万)?人/);
    if (!r) {
      throw new Error("Subscriber count not founded.");
    }
    const subscriberCount = Number.parseFloat(r[1]) * (r[2] ? 10000 : 1);

    return subscriberCount.toString();
  }
}
