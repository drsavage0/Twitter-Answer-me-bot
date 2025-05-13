import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { BotStatus, TwitterCredentials, OpenAICredentials, BotStats, Command } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export function useBotStatus() {
  const queryClient = useQueryClient();

  const { data: status, isLoading: isStatusLoading } = useQuery<BotStatus>({
    queryKey: ['/api/status'],
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery<BotStats>({
    queryKey: ['/api/stats'],
  });

  const { data: commands, isLoading: isCommandsLoading } = useQuery<Command[]>({
    queryKey: ['/api/commands'],
  });

  const connectTwitter = useMutation({
    mutationFn: async (credentials: TwitterCredentials) => {
      const res = await apiRequest('POST', '/api/connect', credentials);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
      toast({
        title: 'Connected to Twitter',
        description: 'Your Twitter account has been connected successfully.',
      });
    },
    onError: (error) => {
      console.error('Error connecting to Twitter:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Twitter. Please check your credentials.',
        variant: 'destructive',
      });
    },
  });

  const configureOpenAI = useMutation({
    mutationFn: async (credentials: OpenAICredentials) => {
      const res = await apiRequest('POST', '/api/openai', credentials);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'OpenAI Configured',
        description: 'Your OpenAI API key has been saved successfully.',
      });
    },
    onError: (error) => {
      console.error('Error configuring OpenAI:', error);
      toast({
        title: 'Configuration Failed',
        description: 'Failed to configure OpenAI. Please check your API key.',
        variant: 'destructive',
      });
    },
  });

  const toggleBotActive = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/toggle', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
      toast({
        title: 'Bot Status Updated',
        description: 'The bot status has been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Error toggling bot status:', error);
      toast({
        title: 'Status Update Failed',
        description: 'Failed to update bot status. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    status: status || { active: false, connected: false, username: '', description: '' },
    stats: stats || { 
      totalResponses: 0,
      todayResponses: 0,
      positiveRating: 0,
      avgResponseTime: 0,
      responseTypes: { witty: 0, roast: 0, debate: 0, peace: 0 }
    },
    commands: commands || [],
    isLoading: isStatusLoading || isStatsLoading || isCommandsLoading,
    connectTwitter,
    configureOpenAI,
    toggleBotActive,
  };
}
