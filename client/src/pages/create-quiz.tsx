import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Please provide a detailed description' }),
  type: z.enum(['couples', 'friends']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  personalityText: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateQuiz() {
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'couples',
      difficulty: 'medium',
      personalityText: '',
    },
  });
  
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      let quizId;
      
      if (data.personalityText && data.personalityText.trim() !== '') {
        // Generate quiz with personality data
        const response = await apiRequest('/api/quizzes/generate/personality', {
          method: 'POST',
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            type: data.type,
            difficulty: data.difficulty,
            personalityText: data.personalityText,
          }),
        });
        quizId = response.quizId;
      } else {
        // Create basic quiz
        const response = await apiRequest('/api/quizzes', {
          method: 'POST',
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            type: data.type,
            difficulty: data.difficulty,
          }),
        });
        quizId = response.id;
      }
      
      toast({
        title: 'Quiz Created',
        description: 'Your quiz has been created successfully',
      });
      
      // Navigate to the quiz detail page or questions editor
      navigate(`/quiz/${quizId}`);
    } catch (error) {
      console.error('Failed to create quiz:', error);
      toast({
        title: 'Failed to Create Quiz',
        description: 'There was an error creating your quiz. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">Create a New Quiz</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quiz Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter quiz title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What's this quiz about? Who is it for?" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quiz Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="couples">Couples</SelectItem>
                        <SelectItem value="friends">Friends Group</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="personalityText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personality Information (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the personalities, preferences, or characteristics of the quiz participants. This helps generate more personalized questions." 
                      {...field} 
                      rows={5}
                    />
                  </FormControl>
                  <p className="text-sm text-gray-500 mt-2">
                    For example: "John loves cats, hates coffee, enjoys hiking on weekends, and is allergic to peanuts. Sarah is a bookworm who collects vinyl records, prefers tea over coffee, and dreams of visiting Japan."
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Quiz'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}