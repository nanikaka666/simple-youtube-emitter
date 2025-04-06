import { YoutubeApiKeyCredential } from "../../src/core/YoutubeApiKeyCredential";

test("valid credential.", () => {
  const credential = "abcdefghijABCDEFGHIJ0123456789-_-_-_-_-";
  expect(new YoutubeApiKeyCredential(credential).credential).toBe(credential);
});

test("empty credential is invalid.", () => {
  expect(() => new YoutubeApiKeyCredential("")).toThrow();
});

test("contains invalid character.", () => {
  expect(
    () => new YoutubeApiKeyCredential("abcdefgh jABCDEFGHIJ0123456789-_-_-_-_-")
  ).toThrow();
});

test("too long credential is invalid.", () => {
  expect(() => new YoutubeApiKeyCredential(Array(66).join("a"))).toThrow();
});
