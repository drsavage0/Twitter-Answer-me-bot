import { nanoid } from 'nanoid';
import { 
  users, quizzes, participants, questions, answers, stats,
  type User, type InsertUser, 
  type Quiz, type InsertQuiz,
  type Participant, type InsertParticipant,
  type Question, type InsertQuestion,
  type Answer, type InsertAnswer,
  type Stats, type InsertStats,
  type QuizWithQuestions, type QuizSummary
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Quiz operations
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizByCode(code: string): Promise<Quiz | undefined>;
  getQuizzes(limit?: number): Promise<QuizSummary[]>;
  getQuizzesByUser(userId: number): Promise<QuizSummary[]>;
  getQuizWithQuestions(quizId: number): Promise<QuizWithQuestions | undefined>;
  
  // Participant operations
  addParticipant(participant: InsertParticipant): Promise<Participant>;
  getParticipant(id: number): Promise<Participant | undefined>;
  getParticipantsByQuiz(quizId: number): Promise<Participant[]>;
  getParticipantByUserAndQuiz(userId: number, quizId: number): Promise<Participant | undefined>;
  updateParticipantScore(id: number, score: number): Promise<Participant | undefined>;
  
  // Question operations
  addQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByQuiz(quizId: number): Promise<Question[]>;
  
  // Answer operations
  addAnswer(answer: InsertAnswer): Promise<Answer>;
  getAnswersByParticipant(participantId: number): Promise<Answer[]>;
  
  // Stats operations
  getStats(userId: number): Promise<Stats | undefined>;
  updateStats(userId: number, updates: Partial<InsertStats>): Promise<Stats | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizzes: Map<number, Quiz>;
  private participants: Map<number, Participant>;
  private questions: Map<number, Question>;
  private answers: Map<number, Answer>;
  private stats: Map<number, Stats>;
  
  private userIdCounter: number;
  private quizIdCounter: number;
  private participantIdCounter: number;
  private questionIdCounter: number;
  private answerIdCounter: number;
  private statsIdCounter: number;

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
    this.participants = new Map();
    this.questions = new Map();
    this.answers = new Map();
    this.stats = new Map();
    
    this.userIdCounter = 1;
    this.quizIdCounter = 1;
    this.participantIdCounter = 1;
    this.questionIdCounter = 1;
    this.answerIdCounter = 1;
    this.statsIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      displayName: insertUser.username,
      profileInfo: null,
      openaiApiKey: null,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Quiz operations
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const id = this.quizIdCounter++;
    const now = new Date();
    const code = nanoid(6).toUpperCase();
    
    const newQuiz: Quiz = {
      ...quiz,
      id,
      createdAt: now,
      code,
      description: quiz.description || null,
      isPublic: quiz.isPublic === undefined ? true : quiz.isPublic
    };
    
    this.quizzes.set(id, newQuiz);
    return newQuiz;
  }
  
  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }
  
  async getQuizByCode(code: string): Promise<Quiz | undefined> {
    return Array.from(this.quizzes.values()).find(
      (quiz) => quiz.code === code
    );
  }
  
  async getQuizzes(limit: number = 20): Promise<QuizSummary[]> {
    const quizzes = Array.from(this.quizzes.values())
      .filter(quiz => quiz.isPublic)
      .sort((a, b) => {
        // Handle null createdAt fields safely
        const dateA = a.createdAt ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt ? b.createdAt.getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
      
    return Promise.all(quizzes.map(async quiz => {
      const creator = await this.getUser(quiz.creatorId);
      const questions = await this.getQuestionsByQuiz(quiz.id);
      const participants = await this.getParticipantsByQuiz(quiz.id);
      
      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description || "",
        creatorName: creator?.displayName || creator?.username || "Unknown",
        participants: participants.length,
        questions: questions.length
      };
    }));
  }
  
  async getQuizzesByUser(userId: number): Promise<QuizSummary[]> {
    const quizzes = Array.from(this.quizzes.values())
      .filter(quiz => quiz.creatorId === userId)
      .sort((a, b) => {
        // Handle null createdAt fields safely
        const dateA = a.createdAt ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt ? b.createdAt.getTime() : 0;
        return dateB - dateA;
      });
      
    return Promise.all(quizzes.map(async quiz => {
      const creator = await this.getUser(quiz.creatorId);
      const questions = await this.getQuestionsByQuiz(quiz.id);
      const participants = await this.getParticipantsByQuiz(quiz.id);
      
      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description || "",
        creatorName: creator?.displayName || creator?.username || "Unknown",
        participants: participants.length,
        questions: questions.length
      };
    }));
  }
  
  async getQuizWithQuestions(quizId: number): Promise<QuizWithQuestions | undefined> {
    const quiz = await this.getQuiz(quizId);
    if (!quiz) return undefined;
    
    const questions = await this.getQuestionsByQuiz(quizId);
    const participants = await this.getParticipantsByQuiz(quizId);
    
    return {
      ...quiz,
      questions,
      participants: participants.length
    };
  }
  
  // Participant operations
  async addParticipant(participant: InsertParticipant): Promise<Participant> {
    const id = this.participantIdCounter++;
    
    const newParticipant: Participant = {
      ...participant,
      id,
      score: 0,
      hasJoined: false,
      joinedAt: null
    };
    
    this.participants.set(id, newParticipant);
    return newParticipant;
  }
  
  async getParticipant(id: number): Promise<Participant | undefined> {
    return this.participants.get(id);
  }
  
  async getParticipantsByQuiz(quizId: number): Promise<Participant[]> {
    return Array.from(this.participants.values())
      .filter(participant => participant.quizId === quizId);
  }
  
  async getParticipantByUserAndQuiz(userId: number, quizId: number): Promise<Participant | undefined> {
    return Array.from(this.participants.values())
      .find(participant => participant.userId === userId && participant.quizId === quizId);
  }
  
  async updateParticipantScore(id: number, score: number): Promise<Participant | undefined> {
    const participant = await this.getParticipant(id);
    if (!participant) return undefined;
    
    const currentScore = participant.score || 0;
    
    const updatedParticipant: Participant = {
      ...participant,
      score,
      hasJoined: true,
      joinedAt: participant.joinedAt || new Date()
    };
    
    this.participants.set(id, updatedParticipant);
    return updatedParticipant;
  }
  
  // Question operations
  async addQuestion(question: InsertQuestion): Promise<Question> {
    const id = this.questionIdCounter++;
    
    const newQuestion: Question = {
      ...question,
      id,
      about: question.about || null,
      explanation: question.explanation || null,
      type: question.type || "multiple_choice"
    };
    
    this.questions.set(id, newQuestion);
    return newQuestion;
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async getQuestionsByQuiz(quizId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.quizId === quizId);
  }
  
  // Answer operations
  async addAnswer(answer: InsertAnswer): Promise<Answer> {
    const id = this.answerIdCounter++;
    const now = new Date();
    
    const newAnswer: Answer = {
      ...answer,
      id,
      answeredAt: now
    };
    
    this.answers.set(id, newAnswer);
    return newAnswer;
  }
  
  async getAnswersByParticipant(participantId: number): Promise<Answer[]> {
    return Array.from(this.answers.values())
      .filter(answer => answer.participantId === participantId);
  }
  
  // Stats operations
  async getStats(userId: number): Promise<Stats | undefined> {
    const userStats = Array.from(this.stats.values())
      .find(stats => stats.userId === userId);
      
    if (userStats) {
      return userStats;
    }
    
    // Create stats if not exist
    const id = this.statsIdCounter++;
    const now = new Date();
    
    const newStats: Stats = {
      id,
      userId,
      totalGames: 0,
      totalWins: 0,
      averageScore: 0,
      questionsAnswered: 0,
      lastUpdated: now
    };
    
    this.stats.set(id, newStats);
    return newStats;
  }
  
  async updateStats(userId: number, updates: Partial<InsertStats>): Promise<Stats | undefined> {
    const userStats = await this.getStats(userId);
    if (!userStats) return undefined;
    
    const now = new Date();
    const updatedStats: Stats = {
      ...userStats,
      ...updates,
      lastUpdated: now
    };
    
    this.stats.set(userStats.id, updatedStats);
    return updatedStats;
  }
}

export const storage = new MemStorage();
