import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string = process.env.OPENAI_API_KEY || "") {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateWittyResponse(
    tweetContent: string,
    authorUsername: string,
    mode: "witty" | "roast" | "debate" | "peace"
  ): Promise<string> {
    try {
      let prompt = "";
      
      switch (mode) {
        case "witty":
          prompt = `You are a witty Twitter bot that creates clever and humorous responses.
            Tweet: "${tweetContent}"
            Author: @${authorUsername}
            
            Generate a witty, clever reply in under 240 characters. Make it funny and engaging, but keep it respectful.
            The response should be a standalone witty comment that anyone would understand without context.`;
          break;
        
        case "roast":
          prompt = `You are a Twitter bot that specializes in gentle roasts and comebacks.
            Tweet: "${tweetContent}"
            Author: @${authorUsername}
            
            Generate a roast reply in under 240 characters. Make it cutting and humorous, but not mean-spirited or offensive.
            Keep the roast focused on the argument or statement, never on personal attributes.`;
          break;
        
        case "debate":
          prompt = `You are a Twitter bot that provides logical counter-arguments in debates.
            Tweet: "${tweetContent}"
            Author: @${authorUsername}
            
            Generate a smart, logical counter-argument in under 240 characters. Be reasonable and fact-based, but with a touch of wit.
            Focus on making a solid point rather than attacking the person.`;
          break;
        
        case "peace":
          prompt = `You are a Twitter bot that de-escalates heated conversations with calming responses.
            Tweet: "${tweetContent}"
            Author: @${authorUsername}
            
            Generate a calming, de-escalating response in under 240 characters. Add a touch of wisdom and humor while encouraging
            civil discourse. Find common ground and reduce tension.`;
          break;
        
        default:
          prompt = `You are a witty Twitter bot that creates clever and humorous responses.
            Tweet: "${tweetContent}"
            Author: @${authorUsername}
            
            Generate a witty, clever reply in under 240 characters. Make it funny and engaging, but keep it respectful.`;
      }

      const response = await this.openai.chat.completions.create({
        model: MODEL,
        messages: [
          { 
            role: "system", 
            content: "You are @answerthembot, a witty Twitter bot that helps users respond to tweets with cleverness and humor. Keep your responses under 240 characters."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 200,
      });

      // Trim and clean up response
      let generatedText = response.choices[0].message.content?.trim() || "";
      
      // Remove quotes if they're wrapping the entire response
      if (generatedText.startsWith('"') && generatedText.endsWith('"')) {
        generatedText = generatedText.substring(1, generatedText.length - 1);
      }
      
      // Make sure the response is within Twitter character limit
      if (generatedText.length > 240) {
        generatedText = generatedText.substring(0, 237) + "...";
      }

      return generatedText;
    } catch (error) {
      console.error("OpenAI generation error:", error);
      throw new Error("Failed to generate response with OpenAI");
    }
  }

  async detectCommandType(
    tweetContent: string
  ): Promise<{
    command: "witty" | "roast" | "debate" | "peace",
    confidence: number
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: 
              "You analyze tweets mentioning @answerthembot to determine what type of response the user wants. " +
              "Classify the request as one of: 'witty', 'roast', 'debate', or 'peace'. " +
              "Respond with JSON in this format: { \"command\": string, \"confidence\": number }. " +
              "command should be one of the four values above, and confidence should be between 0 and 1."
          },
          {
            role: "user",
            content: tweetContent
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Default to witty if no valid command detected
      return {
        command: ["witty", "roast", "debate", "peace"].includes(result.command) 
          ? result.command 
          : "witty",
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
      };
    } catch (error) {
      console.error("OpenAI command detection error:", error);
      // Default to witty mode on error
      return { command: "witty", confidence: 0.5 };
    }
  }
}

export default new OpenAIService();
