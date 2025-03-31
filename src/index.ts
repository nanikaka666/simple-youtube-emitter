import { argv } from "process";
import { SimpleYoutubeEmitter } from "./service/SimpleYoutubeEmitter";
import { YoutubeDataApiV3 } from "./infrastructure/YoutubeDataApiV3";
import { NodeFetch } from "./infrastructure/NodeFetch";

const credential = argv[2];
const channelId = argv[3];

const simple = new SimpleYoutubeEmitter(
  channelId,
  new YoutubeDataApiV3(credential),
  new NodeFetch()
);
simple.on("error", (err) => {
  console.log(err.message);
});
simple.on("start", () => console.log("started!!"));
simple.watch(10 * 1000);
