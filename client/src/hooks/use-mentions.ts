import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { MentionWithResponse } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export function useMentions() {
  const queryClient = useQueryClient();

  const { data: mentions, isLoading, error } = useQuery<MentionWithResponse[]>({
    queryKey: ['/api/mentions'],
  });

  const generateResponse = useMutation({
    mutationFn: async ({ tweetId, mode }: { tweetId: string, mode: string }) => {
      const res = await apiRequest('POST', '/api/generate', { tweetId, mode });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mentions'] });
      toast({
        title: 'Response generated',
        description: 'The response has been generated successfully.',
      });
    },
    onError: (error) => {
      console.error('Error generating response:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate response. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const postResponse = useMutation({
    mutationFn: async ({ tweetId }: { tweetId: string }) => {
      const res = await apiRequest('POST', '/api/respond', { tweetId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mentions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: 'Response posted',
        description: 'Your response has been posted to Twitter.',
      });
    },
    onError: (error) => {
      console.error('Error posting response:', error);
      toast({
        title: 'Error',
        description: 'Failed to post response to Twitter. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    mentions: mentions || [],
    isLoading,
    error,
    generateResponse,
    postResponse,
  };
}
