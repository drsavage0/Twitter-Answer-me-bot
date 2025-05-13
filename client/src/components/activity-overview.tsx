import React from 'react';
import { Statistic } from './ui/statistic';
import { ProgressBar } from './ui/progress-bar';
import { BotStats } from '@/lib/types';

interface ActivityOverviewProps {
  stats: BotStats;
}

export function ActivityOverview({ stats }: ActivityOverviewProps) {
  // Handle case where stats might be undefined or null
  if (!stats) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3">Activity Overview</h2>
        <div className="border border-twitter-border rounded-xl p-4 bg-twitter-darker text-center py-8">
          <p className="text-twitter-text-secondary">Loading statistics...</p>
        </div>
      </div>
    );
  }
  
  // Default values for response types if undefined
  const responseTypes = stats.responseTypes || {
    witty: 0,
    roast: 0,
    debate: 0,
    peace: 0
  };
  
  const segments = [
    { label: 'Witty', value: responseTypes.witty || 0, color: 'bg-blue-500' },
    { label: 'Roast', value: responseTypes.roast || 0, color: 'bg-red-500' },
    { label: 'Debate', value: responseTypes.debate || 0, color: 'bg-yellow-500' },
    { label: 'Peace', value: responseTypes.peace || 0, color: 'bg-green-500' },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-3">Activity Overview</h2>
      <div className="border border-twitter-border rounded-xl p-4 bg-twitter-darker">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Statistic value={stats.totalResponses || 0} label="Total Responses" />
          <Statistic value={stats.todayResponses || 0} label="Today" />
          <Statistic 
            value={`${stats.positiveRating || 0}%`} 
            label="Positive Feedback" 
            valueClassName="text-green-500"
          />
          <Statistic 
            value={`${((stats.avgResponseTime || 0) / 1000).toFixed(1)}s`} 
            label="Avg Response Time" 
            valueClassName="text-yellow-500"
          />
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium mb-2">Response Types</h3>
          <ProgressBar segments={segments} />
        </div>
      </div>
    </div>
  );
}
