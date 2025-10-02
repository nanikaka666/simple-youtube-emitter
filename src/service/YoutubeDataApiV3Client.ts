import { ChannelId, VideoId } from "youtube-live-scraper";
import { YoutubeApiKeyCredential } from "../core/YoutubeApiKeyCredential";
import { fetchAsJson } from "../infrastructure/fetch";
import { YoutubeApiReturnsError } from "../core/YoutubeApiReturnsError";

const videosApiUrl = "https://www.googleapis.com/youtube/v3/videos";
const channelsApiUrl = "https://www.googleapis.com/youtube/v3/channels";

interface LikeCountResponse {
  items: [
    {
      statistics: {
        likeCount: string;
      };
    },
  ];
}

interface LiveViewCountResponse {
  items: [
    {
      liveStreamingDetails: {
        concurrentViewers: string;
      };
    },
  ];
}

interface SubscriberCountResponse {
  items: [
    {
      statistics: {
        subscriberCount: string;
      };
    },
  ];
}

export const YoutubeDataApiV3Client = {
  async getLikeCount(credential: YoutubeApiKeyCredential, videoId: VideoId) {
    const query = new URLSearchParams({
      id: videoId.id,
      key: credential.credential,
      part: "statistics",
    });

    const url = `${videosApiUrl}?{${query}}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await fetchAsJson(url);

    if ("error" in res) {
      throw new YoutubeApiReturnsError(JSON.stringify(res));
    }

    return Number.parseInt((res as LikeCountResponse).items[0].statistics.likeCount);
  },

  async getLiveViewCount(credential: YoutubeApiKeyCredential, videoId: VideoId) {
    const query = new URLSearchParams({
      id: videoId.id,
      key: credential.credential,
      part: "liveStreamingDetails",
    });

    const url = `${videosApiUrl}?{${query}}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await fetchAsJson(url);

    if ("error" in res) {
      throw new YoutubeApiReturnsError(JSON.stringify(res));
    }

    return Number.parseInt(
      (res as LiveViewCountResponse).items[0].liveStreamingDetails.concurrentViewers,
    );
  },

  async getSubscriberCount(credential: YoutubeApiKeyCredential, channelId: ChannelId) {
    const query = new URLSearchParams({
      ...(channelId.isHandle ? { forHandle: channelId.id } : { id: channelId.id }),
      key: credential.credential,
      part: "statistics",
    });

    const url = `${channelsApiUrl}?{${query}}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await fetchAsJson(url);

    if ("error" in res) {
      throw new YoutubeApiReturnsError(JSON.stringify(res));
    }

    return Number.parseInt((res as SubscriberCountResponse).items[0].statistics.subscriberCount);
  },
};
