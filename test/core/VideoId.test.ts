import { VideoId } from "../../src/core/VideoId";

test("valid id will be instanced.", () => {
  const input = "012abcABC_-";
  expect(new VideoId("012abcABC_-").id).toBe(input);
});

test("empty id is not allowed.", () => {
  expect(() => new VideoId("")).toThrow();
});

test("invalid id is not allowed.", () => {
  expect(() => new VideoId("abcdefghijklmnopqrstuvwxyz.")).toThrow();
});
