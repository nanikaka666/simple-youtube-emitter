import { ChannelId } from "../../src/core/ChannelId";

test("valid channel id (not handle), will be instanced.", () => {
  const input = "UC69WCld0Kw_yHFbAqK3v-Rw";
  const actual = new ChannelId(input);
  expect(actual.id).toBe(input);
  expect(actual.isHandle).toBe(false);
});

test("valid channel id (formed as handle), will be instanced.", () => {
  const input = "@abcde0123456789ABCDEFGHIJ";
  const actual = new ChannelId(input);
  expect(actual.id).toBe(input);
  expect(actual.isHandle).toBe(true);
});

test("empty id is not allowed.", () => {
  expect(() => new ChannelId("")).toThrow();
});

test("too long id is not allowed.", () => {
  expect(() => new ChannelId(Array(32).join("a"))).toThrow();
});
