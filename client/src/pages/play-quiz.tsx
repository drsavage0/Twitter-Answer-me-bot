import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, XCircle, TrophyIcon, UsersIcon } from 'lucide-react';

export default function PlayQuiz() {
  const [, navigate] = useLocation();
  const [matched, params] = useRoute('/play/:participantId');
  const participantId = matched ? parseInt(params.participantId) : null;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [leaderboardDialogOpen, setLeaderboardDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: gameData, isLoading, error } = useQuery({
    queryKey: ['/api/participants', participantId],
    queryFn: async () => {
      if (!participantId) return null;
      return apiRequest(`/api/participants/${participantId}`);
    },
    enabled: !!participantId
  });

  const answerMutation = useMutation({
    mutationFn: async ({ questionId, optionId }: { questionId: number; optionId: number }) => {
      return apiRequest('/api/quizzes/answer', {
        method: 'POST',
        body: JSON.stringify({ 
          participantId, 
          questionId, 
          selectedOptionId: optionId 
        }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/participants', participantId] });
      
      // If this was the last question, mark as complete
      if (gameData?.quiz.questions && 
          currentQuestionIndex === gameData.quiz.questions.length - 1) {
        setIsComplete(true);
        setResultsDialogOpen(true);
      } else {
        // Move to the next question
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to Submit Answer',
        description: error.message || 'There was an error submitting your answer.',
        variant: 'destructive',
      });
    }
  });

  const handleOptionSelect = (optionId: number) => {
    setSelectedOption(optionId);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !gameData?.quiz.questions) return;
    
    const currentQuestion = gameData.quiz.questions[currentQuestionIndex];
    
    // Update local answers state
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedOption
    }));
    
    // Submit answer to the server
    answerMutation.mutate({
      questionId: currentQuestion.id,
      optionId: selectedOption
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          <div className="h-6 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Error Loading Quiz</h2>
        <p className="mb-6">There was a problem loading the quiz data.</p>
        <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
      </div>
    );
  }

  const quiz = gameData.quiz;
  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 
    ? ((currentQuestionIndex) / questions.length) * 100 
    : 0;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {currentQuestionIndex + 1} of {questions.length} questions
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <UsersIcon className="h-4 w-4 mr-1" />
              {quiz.participants} participants
            </div>
          </div>
          <Progress value={progress} className="mt-2" />
        </div>

        {questions.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
                <span className="text-sm px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-full">
                  {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 
                   currentQuestion.type === 'true_false' ? 'True/False' : 'Open Ended'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h2 className="text-xl mb-4">{currentQuestion.text}</h2>

                <RadioGroup value={selectedOption?.toString()} onValueChange={(value) => handleOptionSelect(parseInt(value))}>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                        <Label htmlFor={`option-${option.id}`} className="flex-1 py-2">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                disabled={currentQuestionIndex === 0 || answerMutation.isPending}
                onClick={() => {
                  setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
                  setSelectedOption(answers[questions[currentQuestionIndex - 1].id] || null);
                }}
              >
                Previous
              </Button>
              <Button 
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null || answerMutation.isPending}
              >
                {answerMutation.isPending ? 'Submitting...' : (
                  currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="mb-4">This quiz doesn't have any questions yet.</p>
                <Button onClick={() => navigate(`/quiz/${quiz.id}`)}>
                  Return to Quiz Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Dialog */}
      <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">Quiz Results</DialogTitle>
            <DialogDescription className="text-center">
              You've completed the quiz!
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                <TrophyIcon className="h-12 w-12 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="text-2xl font-bold">Your Score</h3>
              <p className="text-4xl font-bold my-2">{gameData.participant.score} / {questions.length}</p>
              <p className="text-lg text-gray-500">
                {gameData.participant.score === questions.length ? 'Perfect score!' : 
                 gameData.participant.score > questions.length * 0.7 ? 'Great job!' : 
                 gameData.participant.score > questions.length * 0.5 ? 'Good effort!' : 
                 'You can do better next time!'}
              </p>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <h4 className="font-medium mb-2">Summary</h4>
              {gameData.answers?.map((answer, index) => (
                <div key={index} className="flex items-start">
                  {answer.isCorrect ? 
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" /> : 
                    <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  }
                  <div className="text-sm">
                    <p className="font-medium">{questions.find(q => q.id === answer.questionId)?.text}</p>
                    <p className="text-gray-500">
                      {answer.isCorrect ? 'Correct answer' : 'Incorrect, correct answer was: ' + 
                      questions.find(q => q.id === answer.questionId)?.options.find(
                        o => o.id === answer.correctOptionId
                      )?.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="sm:flex-1" 
              onClick={() => {
                setResultsDialogOpen(false);
                setLeaderboardDialogOpen(true);
              }}
            >
              View Leaderboard
            </Button>
            <Button 
              className="sm:flex-1"
              onClick={() => {
                setResultsDialogOpen(false);
                navigate(`/quiz/${quiz.id}`);
              }}
            >
              Return to Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leaderboard Dialog */}
      <Dialog open={leaderboardDialogOpen} onOpenChange={setLeaderboardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">Leaderboard</DialogTitle>
            <DialogDescription className="text-center">
              See how you compare with other players
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {gameData.leaderboard?.length ? (
              <div className="space-y-2">
                {gameData.leaderboard.map((entry, index) => (
                  <div 
                    key={index} 
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      entry.username === gameData.participant.displayName 
                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                        : index % 2 === 0 
                        ? 'bg-gray-50 dark:bg-gray-800/50' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-6 text-center font-bold mr-3">
                        {entry.rank}.
                      </div>
                      <div>
                        {entry.displayName}
                        {entry.username === gameData.participant.displayName && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="font-bold">
                      {entry.score} pts
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">
                No leaderboard data available yet.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                setLeaderboardDialogOpen(false);
                navigate(`/quiz/${quiz.id}`);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}