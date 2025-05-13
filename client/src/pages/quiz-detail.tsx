import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardIcon, PlayIcon, PlusCircleIcon, ShareIcon, UsersIcon } from 'lucide-react';

export default function QuizDetail() {
  const [, navigate] = useLocation();
  const [matched, params] = useRoute('/quiz/:id');
  const quizId = matched ? parseInt(params.id) : null;
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const queryClient = useQueryClient();

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['/api/quizzes', quizId],
    queryFn: async () => {
      if (!quizId) return null;
      return apiRequest(`/api/quizzes/${quizId}`);
    },
    enabled: !!quizId
  });

  const joinMutation = useMutation({
    mutationFn: async ({ quizId, code, displayName }: { quizId: number; code: string; displayName: string }) => {
      return apiRequest('/api/quizzes/join', {
        method: 'POST',
        body: JSON.stringify({ quizId, code, displayName }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes', quizId] });
      toast({
        title: 'Joined Successfully',
        description: 'You have joined the quiz. Get ready to play!',
      });
      setJoinDialogOpen(false);
      // Navigate to the play page with the participant ID
      navigate(`/play/${data.participantId}`);
    },
    onError: (error) => {
      toast({
        title: 'Failed to Join',
        description: error.message || 'There was an error joining the quiz.',
        variant: 'destructive',
      });
    }
  });

  const addQuestionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/quizzes/${quizId}/questions`, {
        method: 'POST',
        body: JSON.stringify({ 
          generate: true,
          count: 5
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes', quizId] });
      toast({
        title: 'Questions Added',
        description: 'New questions have been generated and added to your quiz.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Add Questions',
        description: error.message || 'There was an error adding questions to the quiz.',
        variant: 'destructive',
      });
    }
  });

  const handleCopyCode = () => {
    if (quiz?.code) {
      navigator.clipboard.writeText(quiz.code);
      toast({
        title: 'Code Copied',
        description: 'Quiz code has been copied to clipboard.',
      });
    }
  };

  const handleJoin = () => {
    if (!quizId || !quiz?.code) return;
    
    joinMutation.mutate({
      quizId,
      code: quiz.code,
      displayName: customName || 'Anonymous Player'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Error Loading Quiz</h2>
        <p className="mb-6">There was a problem loading the quiz details.</p>
        <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">{quiz.title}</CardTitle>
                <CardDescription className="text-lg">{quiz.description}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Share
                </Button>
                {quiz.isCreator && (
                  <Button variant="outline" size="sm" onClick={() => addQuestionMutation.mutate()}>
                    <PlusCircleIcon className="h-4 w-4 mr-2" />
                    Add Questions
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Quiz Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="font-medium">{quiz.type === 'couples' ? 'Couples Quiz' : 'Friends Quiz'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Difficulty:</span>
                    <span className="font-medium capitalize">{quiz.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Questions:</span>
                    <span className="font-medium">{quiz.questions?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Join Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quiz Code:</span>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">{quiz.code}</span>
                      <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                        <ClipboardIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Participants:</span>
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-2" />
                      <span className="font-medium">{quiz.participants}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {quiz.questions && quiz.questions.length > 0 ? (
              <div>
                <h3 className="font-semibold mb-4">Questions Preview</h3>
                <div className="space-y-4">
                  {quiz.questions.slice(0, 3).map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium">Question {index + 1}</h4>
                        <span className="text-sm px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-full">
                          {question.type === 'multiple_choice' ? 'Multiple Choice' : 
                           question.type === 'true_false' ? 'True/False' : 'Open Ended'}
                        </span>
                      </div>
                      <p>{question.text}</p>
                    </div>
                  ))}
                  {quiz.questions.length > 3 && (
                    <p className="text-center text-sm text-slate-500">
                      +{quiz.questions.length - 3} more questions
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="mb-4">No questions have been added to this quiz yet.</p>
                {quiz.isCreator && (
                  <Button onClick={() => addQuestionMutation.mutate()}>
                    <PlusCircleIcon className="h-4 w-4 mr-2" />
                    Generate Questions
                  </Button>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => setJoinDialogOpen(true)} disabled={quiz.questions?.length === 0}>
              <PlayIcon className="h-4 w-4 mr-2" />
              Play Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Join Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Quiz: {quiz.title}</DialogTitle>
            <DialogDescription>
              Enter your name to join this quiz and test your knowledge.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Your Name
              </Label>
              <Input
                id="name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter your name"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoin} disabled={joinMutation.isPending}>
              {joinMutation.isPending ? 'Joining...' : 'Join Quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Quiz</DialogTitle>
            <DialogDescription>
              Share this quiz with friends or family to test how well they know each other.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <Label className="w-20">Quiz Code:</Label>
              <div className="flex-1 flex items-center gap-2 p-2 border rounded-md">
                <span className="font-mono font-bold text-lg">{quiz.code}</span>
                <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                  <ClipboardIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Share this code with others so they can join your quiz.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}