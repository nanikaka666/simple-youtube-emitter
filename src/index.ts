import { argv } from "process";
import { SimpleYoutubeEventEmitter } from "./SimpleYoutubeEventEmitter";

const credential = argv[2];
console.log(credential);

const channelId = argv[3];
console.log("ChannelId: ", channelId);

const simple = new SimpleYoutubeEventEmitter(credential);
simple.on("error", (err) => {
  console.log(err.message);
});
simple.on("start", () => console.log("started!!"));
simple.watch(channelId, 5);
