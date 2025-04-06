export class YoutubeApiKeyCredential {
  readonly credential: string;
  constructor(credential: string) {
    // this format is unofficial, there is no official definition statement.
    if (credential.match(/^[0-9a-zA-Z_-]{39}$/) === null) {
      throw new Error("Youtube API key is invalid format.");
    }
    this.credential = credential;
  }
}
