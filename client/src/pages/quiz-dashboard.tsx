import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { BookPlusIcon, PlayIcon, TrophyIcon, UserIcon, UsersIcon } from 'lucide-react';

export default function QuizDashboard() {
  const [, navigate] = useLocation();

  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ['/api/quizzes'],
    queryFn: async () => apiRequest('/api/quizzes')
  });

  const { data: myQuizzes, isLoading: isLoadingMyQuizzes } = useQuery({
    queryKey: ['/api/quizzes/mine'],
    queryFn: async () => apiRequest('/api/quizzes/mine')
  });

  const renderQuizCard = (quiz: any) => (
    <Card key={quiz.id} className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        <CardDescription>{quiz.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <UsersIcon className="h-4 w-4 mr-2 text-slate-400" />
            <span>{quiz.participants} participants</span>
          </div>
          <div className="flex items-center">
            <UserIcon className="h-4 w-4 mr-2 text-slate-400" />
            <span>By {quiz.creatorName}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          onClick={() => navigate(`/quiz/${quiz.id}`)} 
          className="w-full"
        >
          <PlayIcon className="h-4 w-4 mr-2" />
          View Quiz
        </Button>
      </CardFooter>
    </Card>
  );

  const renderQuizSkeleton = () => (
    <Card className="h-full">
      <CardHeader>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
      </CardContent>
      <CardFooter>
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Relationship Quiz App</h1>
        <Button onClick={() => navigate('/create-quiz')}>
          <BookPlusIcon className="h-4 w-4 mr-2" />
          Create New Quiz
        </Button>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8 text-white shadow-lg">
        <div className="md:flex items-center">
          <div className="md:w-3/4">
            <h2 className="text-2xl font-bold mb-2">Test How Well You Know Each Other</h2>
            <p className="mb-4">Create fun quizzes to test your friends and family or see how well your partner knows you. Generate personalized questions using AI!</p>
            <Button 
              onClick={() => navigate('/create-quiz')} 
              variant="secondary" 
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Get Started
            </Button>
          </div>
          <div className="hidden md:block md:w-1/4 text-center">
            <TrophyIcon className="h-24 w-24 mx-auto text-yellow-300" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Quizzes</TabsTrigger>
          <TabsTrigger value="mine">My Quizzes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {isLoadingQuizzes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i}>{renderQuizSkeleton()}</div>
              ))}
            </div>
          ) : quizzes && quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz: any) => renderQuizCard(quiz))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No Quizzes Available</h3>
              <p className="text-gray-500 mb-6">Be the first to create a fun relationship quiz!</p>
              <Button onClick={() => navigate('/create-quiz')}>
                Create Your First Quiz
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="mine">
          {isLoadingMyQuizzes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i}>{renderQuizSkeleton()}</div>
              ))}
            </div>
          ) : myQuizzes && myQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myQuizzes.map((quiz: any) => renderQuizCard(quiz))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">You Haven't Created Any Quizzes Yet</h3>
              <p className="text-gray-500 mb-6">Create your first quiz to get started!</p>
              <Button onClick={() => navigate('/create-quiz')}>
                Create Your First Quiz
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}