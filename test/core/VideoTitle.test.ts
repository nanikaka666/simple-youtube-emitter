import { VideoTitle } from "../../src/core/VideoTitle";

test("valid video title will be instanced.", () => {
  const input = "Valid title テスト";
  expect(new VideoTitle(input).title).toBe(input);
});

test("empty video title will be instanced.", () => {
  expect(() => new VideoTitle("")).toThrow();
});

test("too long video title will be instanced.", () => {
  expect(() => new VideoTitle(Array(102).join("a"))).toThrow();
});
