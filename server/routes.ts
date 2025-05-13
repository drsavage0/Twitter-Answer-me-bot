import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import twitterService from "./lib/twitter";
import openaiService, { OpenAIService } from "./lib/openai";
import { insertMentionSchema, ResponseMode } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Twitter service if credentials exist in storage
  const adminUser = await storage.getAdminUser();
  if (adminUser && adminUser.twitterAccessToken && adminUser.twitterAccessSecret) {
    await twitterService.configure(
      adminUser.twitterAccessToken,
      adminUser.twitterAccessSecret,
      process.env.TWITTER_API_KEY || "",
      process.env.TWITTER_API_SECRET || ""
    );
  }

  // API routes
  app.get("/api/status", async (req: Request, res: Response) => {
    try {
      const isConnected = twitterService.isConfigured();
      const adminUser = await storage.getAdminUser();
      
      res.json({
        active: adminUser?.botActive || false,
        connected: isConnected,
        username: isConnected ? twitterService.getUsername() : "",
        description: "Ready to respond with wit & roasts",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get bot status" });
    }
  });

  app.get("/api/mentions", async (req: Request, res: Response) => {
    try {
      const mentions = await storage.getRecentMentions(20);
      res.json(mentions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentions" });
    }
  });

  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/commands", async (req: Request, res: Response) => {
    const commands = [
      {
        name: "Roast Mode",
        icon: "fire",
        description: "Generate a humorous roast reply for someone in the thread.",
        example: "@answerthembot roast this person",
      },
      {
        name: "Witty Mode",
        icon: "smile-wink",
        description: "Generate a clever, witty response to the conversation.",
        example: "@answerthembot give a witty reply",
      },
      {
        name: "Debate Mode",
        icon: "quote-right",
        description: "Generate a logical counter-argument to continue a debate.",
        example: "@answerthembot debate this point",
      },
      {
        name: "Peace Mode",
        icon: "peace",
        description: "Generate a calm, de-escalating response to cool down heated arguments.",
        example: "@answerthembot make peace here",
      },
    ];
    
    res.json(commands);
  });

  // Twitter connection endpoints
  app.post("/api/connect", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        accessToken: z.string(),
        accessSecret: z.string(),
        apiKey: z.string(),
        apiSecret: z.string(),
      });

      const { accessToken, accessSecret, apiKey, apiSecret } = schema.parse(req.body);
      
      const success = await twitterService.configure(
        accessToken,
        accessSecret,
        apiKey,
        apiSecret
      );

      if (success) {
        // Save credentials
        await storage.updateTwitterCredentials(
          accessToken,
          accessSecret,
          twitterService.getUsername()
        );
        
        res.json({ success: true, username: twitterService.getUsername() });
      } else {
        res.status(400).json({ success: false, error: "Invalid Twitter credentials" });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to connect to Twitter" });
    }
  });

  app.post("/api/openai", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        apiKey: z.string(),
      });

      const { apiKey } = schema.parse(req.body);
      
      // Test the API key with a simple request
      // Create a new instance of OpenAI service with the provided key
      const testService = {
        generateWittyResponse: async (message: string, username: string, mode: ResponseMode) => {
          const service = new OpenAIService(apiKey);
          return service.generateWittyResponse(message, username, mode);
        }
      };
      
      const testResponse = await testService.generateWittyResponse(
        "Test message", 
        "testuser",
        "witty"
      );
      
      if (testResponse) {
        await storage.updateOpenAIKey(apiKey);
        res.json({ success: true });
      } else {
        res.status(400).json({ success: false, error: "Invalid OpenAI API key" });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to configure OpenAI" });
    }
  });

  app.post("/api/toggle", async (req: Request, res: Response) => {
    try {
      const active = await storage.toggleBotActive();
      res.json({ active });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle bot status" });
    }
  });

  // Manual response generation endpoint
  app.post("/api/generate", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        tweetId: z.string(),
        mode: z.enum(["witty", "roast", "debate", "peace"])
      });

      const { tweetId, mode } = schema.parse(req.body);
      
      const mention = await storage.getMentionByTweetId(tweetId);
      if (!mention) {
        return res.status(404).json({ error: "Mention not found" });
      }

      // Get admin user to check for OpenAI API key
      const adminUser = await storage.getAdminUser();
      if (!adminUser || !adminUser.openaiApiKey) {
        return res.status(400).json({ error: "OpenAI API key not configured" });
      }

      // Generate response
      const response = await openaiService.generateWittyResponse(
        mention.content,
        mention.authorUsername,
        mode as ResponseMode
      );

      // Store the generated response
      await storage.updateMentionResponse(
        tweetId,
        null, // No tweet ID yet since we haven't posted
        response,
        mode,
        "pending"
      );

      // Return the updated mention
      const updatedMention = await storage.getMentionByTweetId(tweetId);
      res.json(updatedMention);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Post a response to Twitter
  app.post("/api/respond", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        tweetId: z.string()
      });

      const { tweetId } = schema.parse(req.body);
      
      const mention = await storage.getMentionByTweetId(tweetId);
      if (!mention || !mention.responseContent) {
        return res.status(404).json({ error: "Mention or response not found" });
      }

      if (!twitterService.isConfigured()) {
        return res.status(400).json({ error: "Twitter not configured" });
      }

      // Post to Twitter
      const twitterResponse = await twitterService.postReply(
        tweetId,
        mention.responseContent
      );

      // Update status in storage
      await storage.updateMentionResponse(
        tweetId,
        twitterResponse.id,
        mention.responseContent,
        mention.responseMode as ResponseMode,
        "sent"
      );

      // Update stats
      await storage.incrementStats(mention.responseMode as ResponseMode);

      // Return the updated mention
      const updatedMention = await storage.getMentionByTweetId(tweetId);
      res.json(updatedMention);
    } catch (error) {
      res.status(500).json({ error: "Failed to post response to Twitter" });
    }
  });

  // Setup a poll to check for new mentions every minute if bot is active
  setInterval(async () => {
    try {
      const adminUser = await storage.getAdminUser();
      if (!adminUser || !adminUser.botActive) {
        return;
      }

      if (!twitterService.isConfigured()) {
        return;
      }

      // Fetch recent mentions from Twitter
      const mentions = await twitterService.getRecentMentions(10);
      
      for (const mention of mentions) {
        // Check if we've already processed this mention
        const existingMention = await storage.getMentionByTweetId(mention.id);
        if (existingMention) {
          continue;
        }

        // Store the new mention
        const newMention = {
          tweetId: mention.id,
          authorUsername: mention.author.username,
          authorName: mention.author.name,
          authorProfileImage: mention.author.profile_image_url,
          content: mention.text,
          createdAt: new Date(mention.created_at),
          responseStatus: "pending",
        };

        await storage.createMention(newMention);

        // Only auto-respond if OpenAI key is configured
        if (adminUser.openaiApiKey) {
          // Detect command type
          const { command } = await openaiService.detectCommandType(mention.text);
          
          // Generate response
          const response = await openaiService.generateWittyResponse(
            mention.text,
            mention.author.username,
            command
          );

          // Update with the response
          await storage.updateMentionResponse(
            mention.id,
            null, // No response tweet ID yet
            response,
            command,
            "pending"
          );

          // Post to Twitter if auto-respond is enabled
          if (adminUser.botActive) {
            try {
              const twitterResponse = await twitterService.postReply(
                mention.id,
                response
              );

              // Update with the response ID
              await storage.updateMentionResponse(
                mention.id,
                twitterResponse.id,
                response,
                command,
                "sent"
              );

              // Update stats
              await storage.incrementStats(command);
            } catch (twitterError) {
              console.error("Error posting to Twitter:", twitterError);
              // Update status to failed
              await storage.updateMentionResponse(
                mention.id,
                null,
                response,
                command,
                "failed"
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in mentions polling:", error);
    }
  }, 60000); // Check every 60 seconds

  const httpServer = createServer(app);
  return httpServer;
}
