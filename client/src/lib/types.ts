import { 
  ResponseMode, 
  ResponseStatus, 
  Mention,
  MentionWithResponse, 
  BotStatus, 
  BotStats, 
  Command 
} from '@shared/schema';

export type {
  ResponseMode,
  ResponseStatus,
  Mention,
  MentionWithResponse,
  BotStatus,
  BotStats,
  Command
};

export interface TwitterCredentials {
  accessToken: string;
  accessSecret: string;
  apiKey: string;
  apiSecret: string;
}

export interface OpenAICredentials {
  apiKey: string;
}
