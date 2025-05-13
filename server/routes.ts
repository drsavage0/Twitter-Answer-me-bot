import type { Express, Response } from "express";
import { Request } from "express-serve-static-core";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import openaiService from "./lib/openai";
import { 
  insertUserSchema, 
  insertQuizSchema, 
  insertQuestionSchema, 
  insertParticipantSchema,
  insertAnswerSchema
} from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";

// Helper function to handle async request handling
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => 
  (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch((err: Error) => {
      console.error("Error in request handler:", err);
      res.status(500).json({ 
        error: "An unexpected error occurred", 
        message: err.message 
      });
    });
  };

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", asyncHandler(async (req: Request, res: Response) => {
    const registerSchema = insertUserSchema.refine(
      data => data.password === data.confirmPassword,
      { message: "Passwords do not match", path: ["confirmPassword"] }
    );
    
    const userData = registerSchema.parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }
    
    // Create user (in a real app, we would hash the password)
    const user = await storage.createUser(userData);
    
    // Create stats record for new user
    await storage.getStats(user.id); // This will create default stats
    
    // Set session
    if (req.session) {
      req.session.userId = user.id;
    }
    
    res.status(201).json({ 
      id: user.id, 
      username: user.username,
      displayName: user.displayName
    });
  }));
  
  app.post("/api/auth/login", asyncHandler(async (req: Request, res: Response) => {
    const loginSchema = z.object({
      username: z.string(),
      password: z.string()
    });
    
    const { username, password } = loginSchema.parse(req.body);
    
    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) { // In a real app, we would compare hashed passwords
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    // Set session
    if (req.session) {
      req.session.userId = user.id;
    }
    
    res.json({ 
      id: user.id, 
      username: user.username,
      displayName: user.displayName
    });
  }));
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy(err => {
        if (err) {
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });
  
  app.get("/api/auth/me", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    res.json({ 
      id: user.id, 
      username: user.username,
      displayName: user.displayName
    });
  }));
  
  // User profile routes
  app.get("/api/profile", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get user stats
    const stats = await storage.getStats(userId);
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profileInfo: user.profileInfo
      },
      stats: {
        totalGames: stats?.totalGames || 0,
        totalWins: stats?.totalWins || 0,
        averageScore: stats?.averageScore || 0,
        questionsAnswered: stats?.questionsAnswered || 0
      }
    });
  }));
  
  app.put("/api/profile", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const updateSchema = z.object({
      displayName: z.string().optional(),
      profileInfo: z.any().optional()
    });
    
    const updates = updateSchema.parse(req.body);
    const updatedUser = await storage.updateUser(userId, updates);
    
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      profileInfo: updatedUser.profileInfo
    });
  }));
  
  // OpenAI API key management
  app.post("/api/openai/configure", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const schema = z.object({
      apiKey: z.string(),
    });

    const { apiKey } = schema.parse(req.body);
    
    // Test the API key with a simple request
    try {
      const testService = new openaiService.constructor(apiKey);
      const testResponse = await testService.generateWittyResponse(
        "Test message", 
        "testuser",
        "witty"
      );
      
      if (testResponse) {
        await storage.updateUser(userId, { openaiApiKey: apiKey });
        res.json({ success: true });
      } else {
        res.status(400).json({ success: false, error: "Invalid OpenAI API key" });
      }
    } catch (error) {
      res.status(400).json({ success: false, error: "Failed to configure OpenAI: " + error.message });
    }
  }));
  
  // Quiz management routes
  app.post("/api/quizzes", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const quizData = insertQuizSchema.parse(req.body);
    const quiz = await storage.createQuiz({
      ...quizData,
      creatorId: userId
    });
    
    res.status(201).json(quiz);
  }));
  
  app.get("/api/quizzes", asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const quizzes = await storage.getQuizzes(limit);
    res.json(quizzes);
  }));
  
  app.get("/api/quizzes/mine", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const quizzes = await storage.getQuizzesByUser(userId);
    res.json(quizzes);
  }));
  
  app.get("/api/quizzes/:id", asyncHandler(async (req: Request, res: Response) => {
    const quizId = parseInt(req.params.id);
    const quiz = await storage.getQuizWithQuestions(quizId);
    
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    
    res.json(quiz);
  }));
  
  app.post("/api/quizzes/:id/questions", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const quizId = parseInt(req.params.id);
    const quiz = await storage.getQuiz(quizId);
    
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    
    if (quiz.creatorId !== userId) {
      return res.status(403).json({ error: "You don't have permission to add questions to this quiz" });
    }
    
    const questionData = insertQuestionSchema.parse(req.body);
    const question = await storage.addQuestion({
      ...questionData,
      quizId
    });
    
    res.status(201).json(question);
  }));
  
  // Quiz participation routes
  app.post("/api/quizzes/join", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const schema = z.object({
      code: z.string()
    });
    
    const { code } = schema.parse(req.body);
    const quiz = await storage.getQuizByCode(code);
    
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    
    // Check if user is already a participant
    const existingParticipant = await storage.getParticipantByUserAndQuiz(userId, quiz.id);
    
    if (existingParticipant) {
      return res.json({
        quiz,
        participant: existingParticipant
      });
    }
    
    // Create new participant
    const participant = await storage.addParticipant({
      quizId: quiz.id,
      userId,
      hasJoined: true
    });
    
    res.status(201).json({
      quiz,
      participant
    });
  }));
  
  app.post("/api/quizzes/:id/answer", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const quizId = parseInt(req.params.id);
    
    // Get participant
    const participant = await storage.getParticipantByUserAndQuiz(userId, quizId);
    if (!participant) {
      return res.status(404).json({ error: "You're not a participant in this quiz" });
    }
    
    const schema = z.object({
      questionId: z.number(),
      selectedOption: z.number()
    });
    
    const { questionId, selectedOption } = schema.parse(req.body);
    
    // Get question
    const question = await storage.getQuestion(questionId);
    if (!question || question.quizId !== quizId) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    // Check if answer is correct
    const isCorrect = selectedOption === question.correctOption;
    
    // Save answer
    const answer = await storage.addAnswer({
      questionId,
      participantId: participant.id,
      selectedOption,
      isCorrect
    });
    
    // Update participant score if answer is correct
    if (isCorrect) {
      const currentScore = participant.score || 0;
      await storage.updateParticipantScore(participant.id, currentScore + 1);
    }
    
    // Update stats
    await storage.updateStats(userId, {
      questionsAnswered: 1 // This will be added to the current value
    });
    
    res.json({
      answer,
      isCorrect
    });
  }));
  
  // OpenAI integration for quiz generation
  app.post("/api/quizzes/generate", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.openaiApiKey) {
      return res.status(400).json({ error: "OpenAI API key not configured" });
    }
    
    const schema = z.object({
      title: z.string(),
      description: z.string().optional(),
      topic: z.string(),
      numQuestions: z.number().min(1).max(20).default(5)
    });
    
    const { title, description, topic, numQuestions } = schema.parse(req.body);
    
    try {
      // Create quiz
      const quiz = await storage.createQuiz({
        title,
        description: description || "",
        creatorId: userId,
        isPublic: true
      });
      
      // Generate questions using OpenAI
      const openai = new openaiService.constructor(user.openaiApiKey);
      
      const prompt = `Generate ${numQuestions} multiple-choice questions about ${topic} for a fun relationship quiz. 
        Format each question as a JSON object with the following structure:
        {
          "content": "Question text",
          "options": [
            {"id": 0, "text": "Option 1"},
            {"id": 1, "text": "Option 2"},
            {"id": 2, "text": "Option 3"},
            {"id": 3, "text": "Option 4"}
          ],
          "correctOption": 0, // index of the correct option
          "explanation": "Why this answer is correct"
        }
        
        Provide your response as a JSON array of question objects.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a quiz generator assistant" },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      
      const generatedQuestions = JSON.parse(response.choices[0].message.content || "{}");
      
      // Add generated questions to the quiz
      if (Array.isArray(generatedQuestions.questions)) {
        for (const questionData of generatedQuestions.questions) {
          await storage.addQuestion({
            quizId: quiz.id,
            content: questionData.content,
            options: questionData.options,
            correctOption: questionData.correctOption,
            explanation: questionData.explanation,
            type: "multiple_choice"
          });
        }
      }
      
      const quizWithQuestions = await storage.getQuizWithQuestions(quiz.id);
      res.json(quizWithQuestions);
    } catch (error) {
      console.error("OpenAI generation error:", error);
      res.status(500).json({ error: "Failed to generate quiz questions" });
    }
  }));
  
  app.post("/api/quizzes/generate/personality", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.openaiApiKey) {
      return res.status(400).json({ error: "OpenAI API key not configured" });
    }
    
    const schema = z.object({
      title: z.string(),
      description: z.string().optional(),
      participants: z.array(z.object({
        name: z.string(),
        facts: z.array(z.string())
      })),
      numQuestions: z.number().min(1).max(20).default(10)
    });
    
    const { title, description, participants, numQuestions } = schema.parse(req.body);
    
    try {
      // Create quiz
      const quiz = await storage.createQuiz({
        title,
        description: description || "",
        creatorId: userId,
        isPublic: true
      });
      
      // Generate questions using OpenAI
      const openai = new openaiService.constructor(user.openaiApiKey);
      
      // Format participants info for the prompt
      const participantsInfo = participants.map(p => 
        `${p.name}: ${p.facts.join(", ")}`
      ).join("\n");
      
      const prompt = `Generate ${numQuestions} fun multiple-choice questions about these people for a relationship quiz:
        
        ${participantsInfo}
        
        The questions should be fun, engaging, and test how well people know each other.
        Examples: "What is John allergic to?", "What would Sarah most likely do on a weekend?", etc.
        
        Format each question as a JSON object with this structure:
        {
          "content": "Question text",
          "aboutPerson": "Person's name", 
          "options": [
            {"id": 0, "text": "Option 1"},
            {"id": 1, "text": "Option 2"},
            {"id": 2, "text": "Option 3"},
            {"id": 3, "text": "Option 4"}
          ],
          "correctOption": 0, // index of the correct option
          "explanation": "Why this answer is correct"
        }
        
        Provide your response as a JSON object with a 'questions' key containing an array of question objects.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a relationship quiz generator assistant" },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      
      const generatedQuestions = JSON.parse(response.choices[0].message.content || "{}");
      
      // Add generated questions to the quiz
      if (Array.isArray(generatedQuestions.questions)) {
        for (const questionData of generatedQuestions.questions) {
          await storage.addQuestion({
            quizId: quiz.id,
            content: questionData.content,
            about: null, // We'll use the content for now
            options: questionData.options,
            correctOption: questionData.correctOption,
            explanation: questionData.explanation,
            type: "multiple_choice"
          });
        }
      }
      
      const quizWithQuestions = await storage.getQuizWithQuestions(quiz.id);
      res.json(quizWithQuestions);
    } catch (error) {
      console.error("OpenAI generation error:", error);
      res.status(500).json({ error: "Failed to generate personality quiz questions" });
    }
  }));
  
  // Quiz API routes
  app.get("/api/quizzes", asyncHandler(async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const quizzes = await storage.getQuizzes(limit);
      res.json(quizzes);
    } catch (error) {
      console.error("Error getting quizzes:", error);
      res.status(500).json({ message: "Failed to get quizzes", error: (error as Error).message });
    }
  }));

  app.get("/api/quizzes/mine", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const quizzes = await storage.getQuizzesByUser(userId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error getting user quizzes:", error);
      res.status(500).json({ message: "Failed to get user quizzes", error: (error as Error).message });
    }
  }));

  app.get("/api/quizzes/:id", asyncHandler(async (req: Request, res: Response) => {
    try {
      const quizId = parseInt(req.params.id);
      const userId = req.session?.userId;
      
      const quiz = await storage.getQuizWithQuestions(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Add a flag to indicate if the current user is the creator
      const isCreator = userId && quiz.creatorId === userId;
      
      res.json({
        ...quiz,
        isCreator
      });
    } catch (error) {
      console.error("Error getting quiz:", error);
      res.status(500).json({ message: "Failed to get quiz", error: (error as Error).message });
    }
  }));

  app.post("/api/quizzes", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const quizData = insertQuizSchema.parse({
        ...req.body,
        creatorId: userId,
        code: nanoid(6)
      });
      
      const quiz = await storage.createQuiz(quizData);
      res.json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz", error: (error as Error).message });
    }
  }));

  app.post("/api/quizzes/:id/questions", asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const quizId = parseInt(req.params.id);
      
      // Check if the user is the creator of the quiz
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      if (quiz.creatorId !== userId) {
        return res.status(403).json({ message: "You don't have permission to add questions to this quiz" });
      }
      
      const { generate, count = 5 } = req.body;
      
      if (generate) {
        // Generate questions using OpenAI
        const questions = await openaiService.generateQuizQuestions(
          quiz.title,
          quiz.difficulty as any || "medium",
          count,
          "multiple_choice"
        );
        
        // Add generated questions to the quiz
        const addedQuestions = [];
        for (const question of questions) {
          const addedQuestion = await storage.addQuestion({
            quizId,
            text: question.question,
            type: "multiple_choice",
            options: question.options,
            correctOptionId: question.correctOptionId,
            explanation: question.explanation
          });
          addedQuestions.push(addedQuestion);
        }
        
        res.json(addedQuestions);
      } else {
        // Manual question addition
        const questionData = insertQuestionSchema.parse({
          ...req.body,
          quizId
        });
        
        const question = await storage.addQuestion(questionData);
        res.json(question);
      }
    } catch (error) {
      console.error("Error adding questions:", error);
      res.status(500).json({ message: "Failed to add questions", error: (error as Error).message });
    }
  }));

  app.post("/api/quizzes/join", asyncHandler(async (req: Request, res: Response) => {
    try {
      const { quizId, code, displayName } = req.body;
      
      if (!quizId || !code || !displayName) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Verify the quiz code
      const quiz = await storage.getQuiz(quizId);
      if (!quiz || quiz.code !== code) {
        return res.status(400).json({ message: "Invalid quiz code" });
      }
      
      // Generate a username if the user is not logged in
      const userId = req.session?.userId || 0;
      const username = userId ? (await storage.getUser(userId))?.username || "anonymous" : "anonymous";
      
      // Create a participant record
      const participant = await storage.addParticipant({
        quizId,
        userId: userId || 0,
        username,
        displayName,
        score: 0
      });
      
      res.json({ participantId: participant.id, message: "Joined quiz successfully" });
    } catch (error) {
      console.error("Error joining quiz:", error);
      res.status(500).json({ message: "Failed to join quiz", error: (error as Error).message });
    }
  }));

  app.post("/api/quizzes/answer", asyncHandler(async (req: Request, res: Response) => {
    try {
      const { participantId, questionId, selectedOptionId } = req.body;
      
      if (!participantId || !questionId || selectedOptionId === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Get the question to check the answer
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Check if the answer is correct
      const isCorrect = question.correctOptionId === selectedOptionId;
      
      // Record the answer
      const answer = await storage.addAnswer({
        participantId,
        questionId,
        selectedOptionId,
        isCorrect
      });
      
      // If the answer is correct, update the participant's score
      if (isCorrect) {
        const participant = await storage.getParticipant(participantId);
        if (participant) {
          await storage.updateParticipantScore(participantId, (participant.score || 0) + 1);
        }
      }
      
      res.json({ 
        answerId: answer.id, 
        isCorrect, 
        correctOptionId: question.correctOptionId,
        explanation: question.explanation
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
      res.status(500).json({ message: "Failed to submit answer", error: (error as Error).message });
    }
  }));

  app.get("/api/participants/:id", asyncHandler(async (req: Request, res: Response) => {
    try {
      const participantId = parseInt(req.params.id);
      
      // Get the participant
      const participant = await storage.getParticipant(participantId);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      // Get the quiz with questions
      const quiz = await storage.getQuizWithQuestions(participant.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Get the participant's answers
      const answers = await storage.getAnswersByParticipant(participantId);
      
      // Get leaderboard for this quiz
      const allParticipants = await storage.getParticipantsByQuiz(participant.quizId);
      
      // Create leaderboard with rankings
      const leaderboard = allParticipants
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map((p, index) => ({
          username: p.username,
          displayName: p.displayName,
          score: p.score || 0,
          rank: index + 1
        }));
      
      res.json({
        participant,
        quiz,
        answers,
        leaderboard
      });
    } catch (error) {
      console.error("Error getting participant data:", error);
      res.status(500).json({ message: "Failed to get participant data", error: (error as Error).message });
    }
  }));
  
  const httpServer = createServer(app);
  return httpServer;
}
