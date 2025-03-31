import { argv } from "process";
import { SimpleYoutubeEmitter } from "./service/SimpleYoutubeEmitter";

const credential = argv[2];
const channelId = argv[3];

const simple = new SimpleYoutubeEmitter(credential, channelId);
simple.on("error", (err) => {
  console.log(err.message);
});
simple.on("start", () => console.log("started!!"));
simple.watch(channelId, 5);
