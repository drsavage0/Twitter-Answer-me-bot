import React from 'react';
import { Button } from '@/components/ui/button';
import { BotStatus } from '@/lib/types';

interface BotStatusProps {
  status: BotStatus;
  onManage: () => void;
}

export function BotStatus({ status, onManage }: BotStatusProps) {
  return (
    <div className="bg-twitter-darker border border-twitter-border rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-twitter-blue rounded-full flex items-center justify-center">
            <i className="fas fa-robot text-white text-xl"></i>
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold">
              {status.username ? `@${status.username}` : '@answerthembot'}
            </h2>
            <p className="text-twitter-text-secondary">{status.description}</p>
          </div>
        </div>
        <div className="flex items-center">
          <span className={`flex items-center mr-3 ${status.active ? 'text-green-400' : 'text-yellow-400'}`}>
            <i className="fas fa-circle text-xs mr-1"></i>
            <span className="text-sm">{status.active ? 'Active' : 'Inactive'}</span>
          </span>
          <Button 
            variant="outline" 
            onClick={onManage} 
            className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-full text-sm"
          >
            Manage
          </Button>
        </div>
      </div>
    </div>
  );
}
