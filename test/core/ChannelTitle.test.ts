import { ChannelTitle } from "../../src/core/ChannelTitle";

test.each(["ChannelTitle", "「日本語」 【大丈夫】", "many marks.-/_()", "A", Array(101).join("a")])(
  "valid format title will be instanced.",
  (input) => {
    expect(new ChannelTitle(input).title).toBe(input);
  },
);

test("empty title is not allowed.", () => {
  expect(() => new ChannelTitle("")).toThrow();
});

test("too long title is not allowed.", () => {
  expect(() => new ChannelTitle(Array(102).join("a"))).toThrow();
});
