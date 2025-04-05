import { YoutubeApiKeyCredential } from "../../src/core/YoutubeApiKeyCredential";

test.each(["ExampleCredential", Array(65).join("a")])(
  "valid credential.",
  (credential) => {
    expect(new YoutubeApiKeyCredential(credential).credential).toBe(credential);
  }
);

test("empty credential is invalid.", () => {
  expect(() => new YoutubeApiKeyCredential("")).toThrow();
});

test("too long credential is invalid.", () => {
  expect(() => new YoutubeApiKeyCredential(Array(66).join("a"))).toThrow();
});
