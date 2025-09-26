import { ChannelId } from "../../src/core/ChannelId";
import { VideoId } from "../../src/core/VideoId";
import {
  LikeCountUnavailableError,
  YoutubeDataApiWithScraping,
} from "../../src/service/YoutubeDataApiWithScraping";
import { ChannelApiResponse, VideoApiResponse } from "../../src/types";
import { FakeFetch } from "../util/FakeFetch";

describe("videos", () => {
  test("return like count successfully.", async () => {
    const videoId = new VideoId("VVVVVVVVVVV");
    const fakeReturnValue = `
    <head>
        <meta name="title" content="Video Title">
    </head>
    <body>
        <div itemprop="interactionStatistic" itemscope itemtype="https://schema.org/InteractionCounter">
            <meta itemprop="interactionType" content="https://schema.org/LikeAction">
            <meta itemprop="userInteractionCount" content="229">
        </div>
    </body>
    `;
    const fake = new FakeFetch(fakeReturnValue);
    const scraping = new YoutubeDataApiWithScraping(fake);

    const res = await scraping.videos(videoId);
    expect(res).toEqual({
      items: [{ snippet: { title: "Video Title" }, statistics: { likeCount: "229" } }],
    } satisfies VideoApiResponse);
  });

  test("when like count is unavailable, because of the video's config, then an exception will be thrown.", () => {
    const videoId = new VideoId("VVVVVVVVVVV");
    const fakeReturnValue = `
    <head>
        <meta name="title" content="Video Title">
    </head>
    <body>
    </body>
    `;
    const fake = new FakeFetch(fakeReturnValue);
    const scraping = new YoutubeDataApiWithScraping(fake);

    expect(async () => {
      await scraping.videos(videoId);
    }).rejects.toThrow(LikeCountUnavailableError);
  });

  test("when Youtube changes DOM (i.e. tag names, dom structures), then an exception will be thrown.", () => {
    const videoId = new VideoId("VVVVVVVVVVV");
    const fakeReturnValue = `
    <head>
        <meta name="title" content="Video Title">
    </head>
    <body>
        <div itemprop="interactionStatistic" itemscope itemtype="https://schema.org/InteractionCounter">
            <meta itemprop="interactionType" content="https://schema.org/LikeAction">
            <meta itemprop="ChangesHereName" content="229">
        </div>
    </body>
    `;
    const fake = new FakeFetch(fakeReturnValue);
    const scraping = new YoutubeDataApiWithScraping(fake);

    expect(async () => {
      await scraping.videos(videoId);
    }).rejects.toThrow(Error);
  });
});

describe("channels", () => {
  test("return subscriber count successfully.", async () => {
    const channelId = new ChannelId("@TestId");
    const fakeReturnValue = `
        <head>
            <meta itemprop="name" content="Channel Name">
            <script>{"metadataParts":[{"text":{"content":"チャンネル登録者数 1750人"}</script>
        </head>
        <body>
        </body>
        `;
    const fake = new FakeFetch(fakeReturnValue);
    const scraping = new YoutubeDataApiWithScraping(fake);
    const res = await scraping.channels(channelId);
    expect(res).toEqual({
      items: [
        {
          snippet: { title: "Channel Name" },
          statistics: { subscriberCount: "1750" },
        },
      ],
    } satisfies ChannelApiResponse);
  });

  test("return subscriber count successfully when count is over 10,000.", async () => {
    const channelId = new ChannelId("@TestId");
    const fakeReturnValue = `
        <head>
            <meta itemprop="name" content="Channel Name">
            <script>{"metadataParts":[{"text":{"content":"チャンネル登録者数 18.8万人"}</script>
        </head>
        <body>
        </body>
        `;
    const fake = new FakeFetch(fakeReturnValue);
    const scraping = new YoutubeDataApiWithScraping(fake);
    const res = await scraping.channels(channelId);
    expect(res).toEqual({
      items: [
        {
          snippet: { title: "Channel Name" },
          statistics: { subscriberCount: "188000" },
        },
      ],
    } satisfies ChannelApiResponse);
  });

  test("when Youtube changes DOM (i.e. tag names, dom structures), then an exception will be thrown.", () => {
    const channelId = new ChannelId("@TestId");
    const fakeReturnValue = `
        <head>
            <meta itemprop="ChangesHere" content="Channel Name">
            <script>{"metadataParts":[{"text":{"content":"チャンネル登録者数 18.8万人"}</script>
        </head>
        <body>
        </body>
        `;
    const fake = new FakeFetch(fakeReturnValue);
    const scraping = new YoutubeDataApiWithScraping(fake);
    expect(async () => {
      await scraping.channels(channelId);
    }).rejects.toThrow(Error);
  });

  test("when fetching with non Japanese launguage, then an exception will be thrown.", () => {
    const channelId = new ChannelId("@TestId");
    const fakeReturnValue = `
        <head>
            <meta itemprop="ChangesHere" content="Channel Name">
            <script>{"metadataParts":[{"text":{"content":"18.8K Subscribers"}</script>
        </head>
        <body>
        </body>
        `;
    const fake = new FakeFetch(fakeReturnValue);
    const scraping = new YoutubeDataApiWithScraping(fake);
    expect(async () => {
      await scraping.channels(channelId);
    }).rejects.toThrow(Error);
  });
});
