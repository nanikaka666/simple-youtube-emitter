# simple-youtube-emitter

[![npm version](https://badge.fury.io/js/simple-youtube-emitter.svg)](https://badge.fury.io/js/simple-youtube-emitter)
![NPM License](https://img.shields.io/npm/l/simple-youtube-emitter)

This simple module is specialized to emit three events in Youtube live streaming.

1. A timing of raised number of subscribers of your channel.
1. A timing of raised number of likes of your streaming.
1. A timing of raised number of live view counts of your streaming.

# Prerequisites

- Nothing.(From v0.1.5)

- Prepare YouTube API key (Before ~v0.1.4)
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

// initWithoutCredential() method is useful for instantiate, because constructor parameter is a little complicated.
const likeEmitter = LikeCountRaisedEventEmitter.initWithoutCredential(channelId, interval);

// if you had Youtube Data API credential, you can instantiation like below.
// const likeEmitter = LikeCountRaisedEventEmitter.init(channelId, interval, credential);
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

Usage of `SubscriberCountRaisedEventEmitter` and `LiveViewCountRaisedEventEmitter` are almost same as `LikeCountRaisedEventEmitter`.
Change the import statement like below.

```typescript
import { SubscriberCountRaisedEventEmitter } from "simple-youtube-emitter";
```

Event listener for `raised` is like below.

```typescript
subscriberEmitter.on("raised", (before, after) => {
  console.log("Subscriber count is raised.");
  console.log(`ChannelId: ${before.channelId.id}`);
  console.log(`Subscriber count transit: ${before.value} to ${after.value}`);
});
```

Usages of other events (`start`, `end`, `error`) are same as `LikeCountRaisedEventEmitter`.

Of course, `LikeCountRaisedEventEmitter` and `SubscriberCountRaisedEventEmitter` and `LiveViewCountRaisedEventEmitter` can use at the same time.

# Supplementation

- Format of `channelId`.

  - a `channelId` used as first parameter of each `init()` static method, it is acceptable both normal channelId (like `UC6eWCad0KwcyHFbA8K9V-bs` format) and Youtube Handle (like `@HandleName` format).
  - If you want to use Youtube Handle type, the parameter must includes `@` in the head.

- `interval` must be greater than or equal to 10 seconds.

  - If this module is started, continue to polling to find the raised event. `interval` that second parameter of `init()` static method is used as that polling interval.
  - For prevent from unexpected (and unnecessary) high frequency access to Youtube API, `interval` is checked in instantiating class. Because of that, `interval` which set less than 10 seconds will be rejected.
  - I think this threshold will not be obstacle and keep us to use this module safely.

- Be careful Youtube Quota usage, if you instantiate with `init()`.

  - We will consume the Quota of YouTube Data API, so we should be careful the rest of Quota.
  - This module uses only `list` method of YouTube Data API. That method consume one quota by a call.
  - Please mind the quota and set suitable `interval`.
  - More details: [Quota usage](https://developers.google.com/youtube/v3/getting-started#quota)

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

- What's the difference, instantiate with `init()` or with `initWithoutCredential()` ?
  - There are not big difference among them. So calling `initWithoutCredential()` is recommended, that don't consume quotas of Youtube Data API.
  - One appearently difference is abillity of fetch subscriber counts.
    - Instantiate with `initWithoutCredential()`, the emitter will try fetch subscriber count by scraping on Youtube Page. Now it depends on fixed text pattern match using Japanese. So it doesn't work well on non-Japanese page.
    - So if you want to use `SubscriberCountRaisedEventEmitter` and you are non-Japanese, instantiate with `init()`.

# What this module for?

This module help people who want to do live-streaming more listener friendly and interactively.

A timing of raised number of subscribers or likes will make happy streamers. If streamers can catch the timing in real time, they can represent pleasure or thanks as soon as possible; thanks to listener directly, illuminate the stream screens, play the special short movie, and so on.

This module makes such that more easier.
