import { argv } from "process";
import { SimpleYoutubeEmitter } from "./service/SimpleYoutubeEmitter";
import { YoutubeDataApiV3 } from "./infrastructure/YoutubeDataApiV3";

const credential = argv[2];
const channelId = argv[3];

const simple = new SimpleYoutubeEmitter(
  channelId,
  new YoutubeDataApiV3(credential)
);
simple.on("error", (err) => {
  console.log(err.message);
});
simple.on("start", () => console.log("started!!"));
simple.watch(10 * 1000);
