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
        likeCount?: string;
      };
    },
  ];
}

interface LiveViewCountResponse {
  items: [
    {
      liveStreamingDetails: {
        concurrentViewers?: string;
        actualStartTime?: string;
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
  getLikeCount: async (credential: YoutubeApiKeyCredential, videoId: VideoId) => {
    const query = new URLSearchParams({
      id: videoId.id,
      key: credential.credential,
      part: "statistics",
    });

    const url = `${videosApiUrl}?${query}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await fetchAsJson(url);

    if ("error" in res) {
      throw new YoutubeApiReturnsError(JSON.stringify(res));
    }

    const { statistics } = (res as LikeCountResponse).items[0];

    if (statistics.likeCount === undefined) {
      return undefined;
    }

    return Number.parseInt(statistics.likeCount);
  },

  /**
   * Return `0` include meaning of the live has not been begun.
   *
   * Return `undefined` means eigher live view count is invisible or the live has been finished.
   */
  getLiveViewCount: async (credential: YoutubeApiKeyCredential, videoId: VideoId) => {
    const query = new URLSearchParams({
      id: videoId.id,
      key: credential.credential,
      part: "liveStreamingDetails",
    });

    const url = `${videosApiUrl}?${query}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await fetchAsJson(url);

    if ("error" in res) {
      throw new YoutubeApiReturnsError(JSON.stringify(res));
    }

    const { liveStreamingDetails } = (res as LiveViewCountResponse).items[0];

    if (liveStreamingDetails.actualStartTime === undefined) {
      return 0;
    } else if (liveStreamingDetails.concurrentViewers === undefined) {
      return undefined;
    } else {
      return Number.parseInt(liveStreamingDetails.concurrentViewers);
    }
  },

  getSubscriberCount: async (credential: YoutubeApiKeyCredential, channelId: ChannelId) => {
    const query = new URLSearchParams({
      ...(channelId.isHandle ? { forHandle: channelId.id } : { id: channelId.id }),
      key: credential.credential,
      part: "statistics",
    });

    const url = `${channelsApiUrl}?${query}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await fetchAsJson(url);

    if ("error" in res) {
      throw new YoutubeApiReturnsError(JSON.stringify(res));
    }

    return Number.parseInt((res as SubscriberCountResponse).items[0].statistics.subscriberCount);
  },
};
