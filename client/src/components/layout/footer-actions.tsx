import React from 'react';
import { Button } from '@/components/ui/button';
import { BotStatus } from '@/lib/types';

interface FooterActionsProps {
  status: BotStatus;
  onToggleActive: () => void;
  onViewLogs: () => void;
  onSettingsClick: () => void;
}

export function FooterActions({ 
  status, 
  onToggleActive, 
  onViewLogs, 
  onSettingsClick 
}: FooterActionsProps) {
  return (
    <div className="border-t border-twitter-border bg-twitter-darker p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <div className="text-sm text-twitter-text-secondary mb-1">Command status:</div>
          <div className="flex items-center text-sm">
            {status.connected ? (
              status.active ? (
                <>
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span>Bot is actively monitoring mentions</span>
                </>
              ) : (
                <>
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  <span>Bot is connected but not responding</span>
                </>
              )
            ) : (
              <>
                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                <span>Bot is not connected to Twitter</span>
              </>
            )}
            
            {status.connected && (
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-3 text-xs h-6 bg-gray-800 hover:bg-gray-700"
                onClick={onToggleActive}
              >
                {status.active ? 'Deactivate' : 'Activate'}
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onViewLogs}
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            View Logs
          </Button>
          <Button 
            onClick={onSettingsClick}
            className="bg-twitter-blue hover:bg-twitter-blue/90 text-white"
          >
            Settings & API Keys
          </Button>
        </div>
      </div>
    </div>
  );
}
