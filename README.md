# simple-youtube-emitter

[![npm version](https://badge.fury.io/js/simple-youtube-emitter.svg)](https://badge.fury.io/js/simple-youtube-emitter)
![NPM License](https://img.shields.io/npm/l/simple-youtube-emitter)

This simple module is specialized to emit two events in Youtube live streaming.

1. A timing of raised number of subscribers of your channel.
1. A timing of raised number of likes of your streaming.

# Prerequisites

- Prepare YouTube API key
  - This module uses your YouTube API key, because depends on [YouTube Data API](https://developers.google.com/youtube/v3/docs).
    So you need to prepare that key on Google Developer Console.
    Please reference more details on above official link.

# Getting Started

Install

```bash
npm i simple-youtube-emitter
```

Import and create instance

```typescript
import { LikeCountRaisedEventEmitter } from "simple-youtube-emitter";

const channelId = "@ExampleChannel";
const interval = 10 * 1000; // unit is milli seconds.
const credential = "YOUR CREDENTIAL"; // Youtube API key.

// init() method is useful for instantiate, because constructor parameter is a little complicated.
const likeEmitter = LikeCountRaisedEventEmitter.init(channelId, interval, credential);
```

Set your event listener. Supported event names are below:

- `start`
- `raised`
- `end`
- `error`

Example

```typescript
likeEmitter.on("start", () => console.log("Like count event emitter start"));

likeEmitter.on("raised", (before, after) => {
  console.log("Like count is raised.");
  console.log(`VideoId: ${before.videoId.id}`);
  console.log(`VideoTitle: ${before.videoTitle.title}`);
  console.log(`Like count transit: ${before.value} to ${after.value}`);
});

likeEmitter.on("end", () => console.log("Like count event emitter end"));

likeEmitter.on("error", (err) => console.log(err));
```

Start and finish module.

```typescript
likeEmitter.start();
setTimeout(() => likeEmitter.close(), 10 * 60 * 1000); // Finish emitter 10 minutes later.
```

Usage of `SubscriberCountRaisedEventEmitter` is almost same as `LikeCountRaisedEventEmitter`.
Change the import statement like below.

```typescript
import { SubscriberCountRaisedEventEmitter } from "simple-youtube-emitter";
```

Event listener for `raised` is like below.

```typescript
subscriberEmitter.on("raised", (before, after) => {
  console.log("Subscriber count is raised.");
  console.log(`ChannelId: ${before.channelId.id}`);
  console.log(`ChannelTitle: ${before.channelTitle.title}`);
  console.log(`Subscriber count transit: ${before.value} to ${after.value}`);
});
```

Usages of other events (`start`, `end`, `error`) are same as `LikeCountRaisedEventEmitter`.

Of course, `LikeCountRaisedEventEmitter` and `SubscriberCountRaisedEventEmitter` can use at the same time.

# Supplementation

- Format of `channelId`.

  - a `channelId` used as first parameter of each `init()` static method, it is acceptable both normal channelId (like `UC6eWCad0KwcyHFbA8K9V-bs` format) and Youtube Handle (like `@HandleName` format).
  - If you want to use Youtube Handle type, the parameter must includes `@` in the head.

- `interval` must be greater than or equal to 10 seconds.

  - If this module is started, continue to polling to find the raised event. `interval` that second parameter of `init()` static method is used as that polling interval.
  - For prevent from unexpected (and unnecessary) high frequency access to Youtube API, `interval` is checked in instantiating class. Because of that, `interval` which set less than 10 seconds will be rejected.
  - I think this threshold will not be obstacle and keep us to use this module safely.

- Be careful Youtube Quota usage.

  - We will consume the Quota of YouTube Data API, so we should be careful the rest of Quota.
  - This module uses only `list` method of YouTube Data API. That method consume one quota by a call.
  - Please mind the quota and set suitable `interval`.
  - More details: [Quota usage](https://developers.google.com/youtube/v3/getting-started#quota)

- Type of parameter of `raised` event listener.

  - If `raised` event is fired in each EventEmitter, the listener will be taken two parameters `before` and `after`. There are object and its type are same.
  - `LikeCount`: the type of `before` and `after` in `LikeCountRaisedEventEmitter`.

  ```typescript
  const likeCount: LikeCount = ... ;
  likeCount.videoId.id; // string: videoId of live-streaming
  likeCount.videoTitle.title; // string: the title of live-streaming
  likeCount.value; // number: the number of likes
  ```

  - `SubscriberCount`: the type of `before` and `after` in `SubscriberCountRaisedEventEmitter`.

  ```typescript
  const subscriberCount: SubscriberCount = ... ;
  subscriberCount.channelId.id; // string
  subscriberCount.channelTitle.title; // string: channel name
  subscriberCount.value; // number: the number of subscribers
  ```

- Subscriber count is rounded down to three significant digits.

  - Unfortunately this behavior is specification of YouTube Data API, we never avoid it.
  - On the other hand, like count is accuracy.
  - [Source](https://developers.google.com/youtube/v3/revision_history#release_notes_09_10_2019)

- When is `raised` event fired?

  - The more accurate definition of `raised` is, "Update the maximum so far".
  - For example in case of likes count, if transit of likes are below,

  ```
  # Pollings : like count
  1: 0
  2: 5
  3: 3
  4: 4
  5: 6
  6: 6
  ```

  `LikeCountRaisedEventEmitter` will fire two `raised` events at 2nd and 5th polling.
  The result of 4th polling, like count value is surely higher previous result, but it isn't higher maximum count so far, that's why `raised` event will not be fired at 4th polling.
  So that, `after.value` is surely higher `before.value`.

- To start `LikeCountRaisedEventEmitter`, it will need either live-streaming on air or upcoming live-streaming on your channel.
  - `LikeCountRaisedEventEmitter` assume that it is used in live-streaming on air, or before starting live-streaming. Otherwise it will throw an `error` event.
  - `SubscriberCountRaisedEventEmitter` has no such restriction.

# What this module for?

This module help people who want to do live-streaming more listener friendly and interactively.

A timing of raised number of subscribers or likes will make happy streamers. If streamers can catch the timing in real time, they can represent pleasure or thanks as soon as possible; thanks to listener directly, illuminate the stream screens, play the special short movie, and so on.

This module makes such that more easier.
