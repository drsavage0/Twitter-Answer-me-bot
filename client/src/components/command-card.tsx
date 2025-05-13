import React from 'react';
import { Command } from '@/lib/types';

interface CommandCardProps {
  command: Command;
}

export function CommandCard({ command }: CommandCardProps) {
  return (
    <div className="border border-twitter-border rounded-xl p-4 bg-twitter-darker/70">
      <div className="flex items-center text-twitter-blue mb-2">
        <i className={`fas fa-${command.icon} mr-2`}></i>
        <h3 className="font-bold">{command.name}</h3>
      </div>
      <p className="text-twitter-text-secondary text-sm mb-2">{command.description}</p>
      <div className="bg-gray-800 p-2 rounded text-sm font-mono">
        {command.example}
      </div>
    </div>
  );
}
