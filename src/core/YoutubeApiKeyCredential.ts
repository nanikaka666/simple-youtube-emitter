export class YoutubeApiKeyCredential {
  readonly credential: string;
  constructor(credential: string) {
    if (credential === "") {
      throw new Error("Youtube API key credential is empty.");
    }
    // this threshold has no evidence, there is no official definition.
    if (credential.length > 64) {
      throw new Error("Youtube API key is invalid format.");
    }
    this.credential = credential;
  }
}
