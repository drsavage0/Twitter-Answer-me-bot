import React from 'react';
import { Button } from '@/components/ui/button';
import { MentionWithResponse, ResponseMode } from '@/lib/types';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

interface MentionCardProps {
  mention: MentionWithResponse;
  onGenerate?: (tweetId: string, mode: ResponseMode) => void;
  onPost?: (tweetId: string) => void;
}

export function MentionCard({ mention, onGenerate, onPost }: MentionCardProps) {
  const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    const intervals = {
      y: 31536000,
      mon: 2592000,
      w: 604800,
      d: 86400,
      h: 3600,
      m: 60,
      s: 1
    };
    
    if (seconds < intervals.m) return `${seconds}s`;
    if (seconds < intervals.h) return `${Math.floor(seconds / intervals.m)}m`;
    if (seconds < intervals.d) return `${Math.floor(seconds / intervals.h)}h`;
    if (seconds < intervals.w) return `${Math.floor(seconds / intervals.d)}d`;
    if (seconds < intervals.mon) return `${Math.floor(seconds / intervals.w)}w`;
    if (seconds < intervals.y) return `${Math.floor(seconds / intervals.mon)}mon`;
    return `${Math.floor(seconds / intervals.y)}y`;
  };

  const modeLabel = {
    witty: "Witty mode",
    roast: "Roast mode",
    debate: "Debate mode",
    peace: "Peace mode"
  };

  const statusLabel = {
    pending: "Ready to send",
    sent: "Auto-responded",
    failed: "Failed to send"
  };

  const statusColor = {
    pending: "text-yellow-400",
    sent: "text-green-400",
    failed: "text-red-400"
  };

  return (
    <div className="border border-twitter-border rounded-xl mb-4 overflow-hidden">
      {/* Tweet content */}
      <div className="p-4">
        <div className="flex">
          <div className="flex-shrink-0 mr-3">
            {mention.authorProfileImage ? (
              <img src={mention.authorProfileImage} alt="User avatar" className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-gray-400"></i>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-1 mb-1">
              <span className="font-bold">{mention.authorName || mention.authorUsername}</span>
              <span className="text-twitter-text-secondary">@{mention.authorUsername}</span>
              <span className="text-twitter-text-secondary">·</span>
              <span className="text-twitter-text-secondary">
                {timeAgo(new Date(mention.createdAt))}
              </span>
            </div>
            <div className="mb-2 text-[15px]">
              {mention.content}
            </div>
            <div className="flex space-x-10 text-twitter-text-secondary text-sm mt-3">
              <button className="flex items-center space-x-1 hover:text-twitter-blue group">
                <i className="far fa-comment group-hover:text-twitter-blue"></i>
                <span>0</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-green-500 group">
                <i className="far fa-retweet group-hover:text-green-500"></i>
                <span>0</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-pink-500 group">
                <i className="far fa-heart group-hover:text-pink-500"></i>
                <span>0</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-twitter-blue group">
                <i className="far fa-share-square group-hover:text-twitter-blue"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bot response section */}
      <div className="border-t border-twitter-border bg-twitter-darker/50 p-4">
        <div className="flex">
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 bg-twitter-blue rounded-full flex items-center justify-center">
              <i className="fas fa-robot text-white"></i>
            </div>
          </div>
          <div className="flex-1">
            {mention.responseContent ? (
              <>
                <div className="flex items-center space-x-1 mb-1">
                  <span className="font-bold">AnswerThemBot</span>
                  <span className="text-twitter-text-secondary">@answerthembot</span>
                  <span className="text-twitter-text-secondary">·</span>
                  <span className="text-twitter-text-secondary">
                    {mention.responseSentAt ? timeAgo(new Date(mention.responseSentAt)) : 'Now'}
                  </span>
                </div>
                <div className="mb-2 text-[15px]">
                  {mention.responseContent}
                </div>
                <div className="flex items-center text-xs text-twitter-text-secondary mt-1">
                  <span className="bg-gray-800 px-2 py-0.5 rounded-full">
                    {mention.responseMode ? modeLabel[mention.responseMode as ResponseMode] : 'Auto mode'}
                  </span>
                  <span className="mx-2">•</span>
                  <span className={statusColor[mention.responseStatus as keyof typeof statusColor]}>
                    {statusLabel[mention.responseStatus as keyof typeof statusLabel]}
                  </span>
                  
                  {mention.responseStatus === 'pending' && onPost && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2 h-6 bg-twitter-blue hover:bg-twitter-blue/90"
                      onClick={() => onPost(mention.tweetId)}
                    >
                      Post
                    </Button>
                  )}
                </div>
              </>
            ) : mention.isLoading ? (
              <>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="bg-gray-700/50 h-6 w-40 rounded animate-pulse"></div>
                </div>
                <div className="mb-2">
                  <div className="bg-gray-700/50 h-4 w-full rounded mb-1 animate-pulse"></div>
                  <div className="bg-gray-700/50 h-4 w-5/6 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center text-xs text-twitter-text-secondary mt-3">
                  <span className="text-yellow-500">Generating response...</span>
                </div>
              </>
            ) : onGenerate ? (
              <div className="flex items-center mt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-twitter-blue hover:bg-twitter-blue/90 text-white">
                      Generate Response
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onGenerate(mention.tweetId, 'witty')}>
                      <i className="fas fa-smile-wink mr-2"></i> Witty
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onGenerate(mention.tweetId, 'roast')}>
                      <i className="fas fa-fire mr-2"></i> Roast
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onGenerate(mention.tweetId, 'debate')}>
                      <i className="fas fa-quote-right mr-2"></i> Debate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onGenerate(mention.tweetId, 'peace')}>
                      <i className="fas fa-peace mr-2"></i> Peace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="text-twitter-text-secondary text-sm">
                Configure API keys to enable bot responses
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
