import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { FooterActions } from '@/components/layout/footer-actions';
import { BotStatus } from '@/components/bot-status';
import { MentionCard } from '@/components/mention-card';
import { CommandCard } from '@/components/command-card';
import { ActivityOverview } from '@/components/activity-overview';
import { useBotStatus } from '@/hooks/use-bot-status';
import { useMentions } from '@/hooks/use-mentions';
import { ResponseMode } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  
  const { status, stats, commands, toggleBotActive } = useBotStatus();
  const { mentions, generateResponse, postResponse } = useMentions();

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleToggleActive = async () => {
    try {
      await toggleBotActive.mutateAsync();
      toast({
        title: status.active ? 'Bot Deactivated' : 'Bot Activated',
        description: status.active 
          ? 'The bot will stop responding to mentions' 
          : 'The bot will now automatically respond to mentions',
      });
    } catch (error) {
      console.error('Error toggling bot status:', error);
    }
  };

  const handleGenerate = async (tweetId: string, mode: ResponseMode) => {
    try {
      await generateResponse.mutateAsync({ tweetId, mode });
    } catch (error) {
      console.error('Error generating response:', error);
    }
  };

  const handlePost = async (tweetId: string) => {
    try {
      await postResponse.mutateAsync({ tweetId });
    } catch (error) {
      console.error('Error posting response:', error);
    }
  };

  const handleSettingsClick = () => {
    setIsApiDialogOpen(true);
  };

  const handleViewLogs = () => {
    setIsLogsDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-twitter-dark text-twitter-text-primary">
      <Header 
        status={status} 
        onMobileMenuToggle={handleMobileMenuToggle} 
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isMobileMenuOpen} />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <BotStatus 
              status={status} 
              onManage={handleSettingsClick} 
            />
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold">Recent Mentions</h2>
                <button className="text-twitter-blue hover:underline text-sm">View all</button>
              </div>
              
              {mentions.map((mention) => (
                <MentionCard 
                  key={mention.tweetId} 
                  mention={mention}
                  onGenerate={handleGenerate}
                  onPost={handlePost}
                />
              ))}
              
              {mentions.length === 0 && (
                <div className="border border-twitter-border rounded-xl p-6 text-center">
                  <div className="text-twitter-text-secondary mb-2">
                    <i className="fas fa-inbox text-3xl mb-2"></i>
                    <p>No mentions found</p>
                  </div>
                  <p className="text-sm text-twitter-text-secondary">
                    {status.connected 
                      ? 'Waiting for someone to mention @answerthembot on Twitter' 
                      : 'Connect your Twitter account to start receiving mentions'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3">Available Commands</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {commands.map((command, index) => (
                  <CommandCard key={index} command={command} />
                ))}
              </div>
            </div>
            
            <ActivityOverview stats={stats} />
          </div>
          
          <FooterActions 
            status={status}
            onToggleActive={handleToggleActive}
            onViewLogs={handleViewLogs}
            onSettingsClick={handleSettingsClick}
          />
        </main>
      </div>

      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogContent className="bg-twitter-darker border-twitter-border max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-twitter-text-primary">Bot Activity Logs</DialogTitle>
          </DialogHeader>
          <div className="font-mono text-sm bg-gray-900 p-4 rounded-md h-96 overflow-y-auto">
            <p className="text-green-400">[System] Bot initialized</p>
            <p className="text-twitter-text-secondary">[Info] Waiting for mentions...</p>
            {mentions.map((mention, idx) => (
              <React.Fragment key={idx}>
                <p className="text-twitter-blue">
                  [Mention] Received from @{mention.authorUsername}: {mention.content.substring(0, 50)}...
                </p>
                {mention.responseContent && (
                  <p className="text-yellow-400">
                    [Response] ({mention.responseMode}) {mention.responseContent.substring(0, 50)}...
                  </p>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button 
              className="bg-gray-800 hover:bg-gray-700"
              onClick={() => setIsLogsDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
