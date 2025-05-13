import { TwitterApi } from "twitter-api-v2";

export class TwitterService {
  private twitterClient: TwitterApi | null = null;
  private username: string = "";

  constructor(
    accessToken: string = process.env.TWITTER_ACCESS_TOKEN || "",
    accessSecret: string = process.env.TWITTER_ACCESS_SECRET || "",
    apiKey: string = process.env.TWITTER_API_KEY || "",
    apiSecret: string = process.env.TWITTER_API_SECRET || ""
  ) {
    if (accessToken && accessSecret && apiKey && apiSecret) {
      this.twitterClient = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken: accessToken,
        accessSecret: accessSecret,
      });
    }
  }

  isConfigured(): boolean {
    return this.twitterClient !== null;
  }

  async initialize(): Promise<boolean> {
    if (!this.twitterClient) {
      return false;
    }

    try {
      const user = await this.twitterClient.v2.me();
      if (user.data) {
        this.username = user.data.username;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Twitter API initialization error:", error);
      return false;
    }
  }

  getUsername(): string {
    return this.username;
  }

  async getRecentMentions(count: number = 20): Promise<any[]> {
    if (!this.twitterClient) {
      throw new Error("Twitter client not configured");
    }

    try {
      const mentions = await this.twitterClient.v2.search({
        query: `@${this.username}`,
        expansions: [
          'author_id',
          'referenced_tweets.id',
          'referenced_tweets.id.author_id',
        ],
        'user.fields': ['name', 'username', 'profile_image_url'],
        'tweet.fields': ['created_at', 'conversation_id', 'public_metrics'],
        max_results: count,
      });

      if (!mentions.data || !mentions.data.data) {
        return [];
      }

      return mentions.data.data.map(tweet => {
        const author = mentions.data.includes?.users?.find(u => u.id === tweet.author_id);
        
        return {
          id: tweet.id,
          text: tweet.text,
          created_at: tweet.created_at,
          author: {
            id: author?.id,
            username: author?.username,
            name: author?.name,
            profile_image_url: author?.profile_image_url,
          },
          metrics: tweet.public_metrics,
          conversation_id: tweet.conversation_id,
          referenced_tweets: tweet.referenced_tweets,
        };
      });
    } catch (error) {
      console.error("Error fetching mentions:", error);
      throw new Error("Failed to fetch mentions from Twitter");
    }
  }

  async postReply(tweetId: string, text: string): Promise<any> {
    if (!this.twitterClient) {
      throw new Error("Twitter client not configured");
    }

    try {
      const response = await this.twitterClient.v2.reply(
        text,
        tweetId
      );

      return {
        id: response.data.id,
        text: response.data.text,
      };
    } catch (error) {
      console.error("Error posting reply:", error);
      throw new Error("Failed to post reply to Twitter");
    }
  }

  async configure(
    accessToken: string,
    accessSecret: string,
    apiKey: string,
    apiSecret: string
  ): Promise<boolean> {
    try {
      this.twitterClient = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken: accessToken,
        accessSecret: accessSecret,
      });
      
      return await this.initialize();
    } catch (error) {
      console.error("Twitter configuration error:", error);
      this.twitterClient = null;
      return false;
    }
  }
}

export default new TwitterService();
