import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { aiRateLimiter } from './services/aiService.js';
import dotenv from 'dotenv';
import curateResourcesRouter from './routes/curateResources.js';
import generatePlanRouter from './routes/generatePlan.js';
import pdfChatRouter from './routes/pdfChat.js';
import analyticsRouter from './routes/analytics.js';
import remindersRouter from './routes/reminders.js';
import chatHistoryRouter from './routes/chatHistory.js';
import topicMasteryRouter from './routes/topicMastery.js';
import webhooksRouter from './routes/webhooks.js';
import webSearchRouter from './routes/webSearch.js';
import quizRouter from './routes/quiz.js';
import performanceRouter from './routes/performance.js';
import userChatHistoryRouter from './routes/userChatHistory.js';
import { validateUserAuth } from './middleware/userAuth.js';
import rateLimit from 'express-rate-limit';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
// Load environment variables from root .env
dotenv.config({ path: path.resolve(import.meta.dirname, '../.env') });

// Ensure required directories exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  await mkdir(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

const app = express();
const port = process.env.PORT || 8000;

// Trust proxy - required for rate limiting behind reverse proxies
app.set('trust proxy', 1);
app.use(express.json());

// Middleware
app.use(
  cors({
    origin: [
      "https://mind-mentor-pearl.vercel.app",
      "https://mind-mentor.kartiklabhshetwar.me",
      "http://localhost:3000",
      "https://www.mind-mentor.ink",
      "https://mind-mentor.ink",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  // Add trusted proxy configuration
  trustProxy: true
});

// Apply rate limiter to all routes
app.use(limiter);

// Apply rate limiter to AI-related routes
app.use('/api/resources', aiRateLimiter);
app.use('/api/study-plan', aiRateLimiter);

// Basic health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Mind Mentor API is running' });
});

// Lightweight health check for Docker (no embeddings)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Mind Mentor API is running',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Apply routes directly without auth middleware
app.use('/generate-plan', generatePlanRouter);
app.use('/curate-resources', curateResourcesRouter);
app.use('/pdf', pdfChatRouter);
app.use('/web-search', webSearchRouter);

// New agent-facing routes
app.use('/api/analytics', analyticsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/chat/history', chatHistoryRouter);
app.use('/api/topics/mastery', topicMasteryRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/quiz', validateUserAuth, quizRouter);
app.use('/api/performance', validateUserAuth, performanceRouter);
app.use('/api/user/chat-history', validateUserAuth, userChatHistoryRouter);

// Error handling middleware
app.use((err, req, res) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
