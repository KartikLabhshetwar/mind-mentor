import Groq from "groq-sdk";
import StudyPlan from "../models/studyPlan.js";
import NodeCache from "node-cache";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import fetch from "node-fetch";
import https from "https";

// Initialize dotenv
dotenv.config();

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not set in environment variables");
}

// Initialize Groq client with explicit API key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Initialize cache with 30 minutes TTL
const cache = new NodeCache({ stdTTL: 1800 });

// Rate limiter for AI requests - 100 requests per IP per hour
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after an hour",
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});

// Create a custom HTTPS agent that doesn't reject unauthorized certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseDateOnly(dateString) {
  const [year, month, day] = String(dateString).split("-").map(Number);

  if (!year || !month || !day) {
    return new Date(dateString);
  }

  return new Date(year, month - 1, day);
}

function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function calculateDaysUntilExam(examDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exam = parseDateOnly(examDate);
  exam.setHours(0, 0, 0, 0);

  return Math.max(1, Math.ceil((exam - today) / MS_PER_DAY));
}

function normalizeTaskText(task) {
  if (typeof task === "string") {
    return task;
  }

  if (task && typeof task === "object") {
    const text = [task.text, task.task, task.label, task.name, task.title].find(
      (candidate) => typeof candidate === "string" && candidate.trim(),
    );

    if (text) {
      return text;
    }
  }

  return "Review and practice the assigned topic";
}

function normalizeWeeklyPlans(weeklyPlans, expectedStudyDays) {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const flattenedDailyTasks = weeklyPlans.flatMap((week, sourceWeekIndex) =>
    (Array.isArray(week.dailyTasks) ? week.dailyTasks : []).map((day) => ({
      sourceWeekIndex,
      tasks: Array.isArray(day.tasks)
        ? day.tasks.map((task) => ({
            text: normalizeTaskText(task),
            completed: false,
          }))
        : [],
      duration: day.duration || "1-2 hours",
    })),
  );
  const totalScheduledDays = Math.max(
    flattenedDailyTasks.length,
    expectedStudyDays,
  );

  return flattenedDailyTasks.reduce((weeks, dayTask, dayIndex) => {
    const weekIndex = Math.floor(dayIndex / 7);
    const scheduledDate = addDays(startDate, dayIndex);
    const weekStartDate = addDays(startDate, weekIndex * 7);
    const weekEndOffset = Math.min(weekIndex * 7 + 6, totalScheduledDays - 1);
    const weekEndDate = addDays(startDate, weekEndOffset);

    if (!weeks[weekIndex]) {
      const sourceWeek =
        weeklyPlans[weekIndex] || weeklyPlans[dayTask.sourceWeekIndex] || {};

      weeks[weekIndex] = {
        week: `Week ${weekIndex + 1} (${formatDateOnly(
          weekStartDate,
        )} to ${formatDateOnly(weekEndDate)})`,
        goals: Array.isArray(sourceWeek.goals) ? sourceWeek.goals : [],
        dailyTasks: [],
      };
    }

    weeks[weekIndex].dailyTasks.push({
      day: `${formatDateOnly(scheduledDate)} (Day ${dayIndex + 1})`,
      tasks: dayTask.tasks,
      duration: dayTask.duration,
    });

    return weeks;
  }, []);
}

async function searchTavily(subject) {
  // Cache key for Tavily search
  const cacheKey = `tavily_${subject}`;

  // Check cache first
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query: `best free learning resources tutorials courses guides documentation for learning ${subject}`,
        search_depth: "advanced",
        include_answer: "basic",
        max_results: 15,
        topic: "general",
        include_domains: [
          "coursera.org",
          "khanacademy.org",
          "freecodecamp.org",
          "w3schools.com",
          "developer.mozilla.org",
          "tutorialspoint.com",
          "geeksforgeeks.org",
          "youtube.com",
          "medium.com",
          "udemy.com",
          "udacity.com",
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Tavily search failed");
    }

    const result = await response.json();
    // Cache the result
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Tavily search error:", error);
    return { results: [], answer: "" };
  }
}

async function curateResources(searchData, subject) {
  const cacheKey = `resources_${subject}`;

  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const tavilyResults = searchData.results?.slice(0, 10) || [];
  if (tavilyResults.length === 0) {
    return { resources: [] };
  }

  // Take top 5 Tavily results — URLs are real and verified by Tavily
  const topResults = tavilyResults.slice(0, 5);

  try {
    // Use LLM only for enriching descriptions — NOT for selecting URLs
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You enrich learning resource metadata. You will receive exactly ${topResults.length} resources with fixed URLs. Write a description, format type, and benefits for each. Do NOT change the url or title. Respond in JSON only.`,
        },
        {
          role: "user",
          content: `Enrich these ${topResults.length} learning resources for "${subject}". Keep url and title exactly as given.

${JSON.stringify(topResults.map((r, i) => ({ index: i, title: r.title, url: r.url, content: r.content?.slice(0, 200) })), null, 2)}

Return JSON:
{
  "resources": [
    {
      "index": 0,
      "description": "2-3 sentence description",
      "format": "Video Course | Interactive Tutorial | Documentation | Article | Guide",
      "benefits": ["benefit 1", "benefit 2", "benefit 3"]
    }
  ]
}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      top_p: 1,
      stream: false,
      response_format: { type: "json_object" },
    });

    const enrichment = JSON.parse(completion.choices[0]?.message?.content || "{}");
    const enrichMap = new Map();
    if (enrichment.resources) {
      for (const r of enrichment.resources) {
        enrichMap.set(r.index, r);
      }
    }

    // Build final resources — URLs always come from Tavily, never from LLM
    const resources = topResults.map((r, i) => {
      const enriched = enrichMap.get(i) || {};
      return {
        title: r.title || `${subject} Learning Resource`,
        url: r.url,
        description: enriched.description || r.content?.slice(0, 200) || `Resource for learning ${subject}`,
        format: enriched.format || "Website",
        benefits: enriched.benefits || [`Learn ${subject} effectively`],
      };
    });

    const finalResult = { resources };
    cache.set(cacheKey, finalResult);
    return finalResult;
  } catch (error) {
    console.error("Groq error:", error);
    if (error.status === 429 || error.status === 413) {
      const retryAfter = error.headers?.["retry-after"] || 60;
      throw {
        status: error.status,
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        retryAfter,
      };
    }
    // Fallback: return Tavily results without LLM enrichment
    const fallbackResources = topResults.map((r) => ({
      title: r.title || `${subject} Learning Resource`,
      url: r.url,
      description: r.content?.slice(0, 200) || `Resource for learning ${subject}`,
      format: "Website",
      benefits: [`Learn ${subject} effectively`],
    }));
    return { resources: fallbackResources };
  }
}

async function generatePlan(subject, userId, examDate) {
  // Cache key for study plan
  const cacheKey = `plan_${userId}_${subject}_${examDate}`;

  // Check cache first
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  // Calculate days until exam
  const daysUntilExam = calculateDaysUntilExam(examDate);
  const totalWeeks = Math.max(1, Math.ceil(daysUntilExam / 7));

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are an expert study planner who creates detailed and effective study plans. Always respond in JSON format.",
        },
        {
          role: "user",
          content: `Create a detailed study plan for ${subject} with ${daysUntilExam} days until the exam on ${examDate}.
          Create exactly ${totalWeeks} weekly plan sections. Each week must contain only the dates that belong to that week:
          - Week 1: days 1-7 from today
          - Week 2: days 8-14 from today
          - Continue this pattern until the exam date
          Do not put all dates inside Week 1.
          
          Return the response in this exact JSON format:
          {
            "overview": {
              "subject": "${subject}",
              "duration": "${daysUntilExam} days",
              "examDate": "${examDate}"
            },
            "weeklyPlans": [
              {
                "week": "Week 1",
                "goals": ["Goal 1", "Goal 2"],
                "dailyTasks": [
                  {
                    "day": "YYYY-MM-DD (Day X)",
                    "tasks": ["Task 1", "Task 2"],
                    "duration": "X hours"
                  }
                ]
              }
            ],
            "recommendations": ["Tip 1", "Tip 2"]
          }`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1,
      stream: false,
      response_format: { type: "json_object" },
    });

    const parsedPlan = JSON.parse(
      completion.choices[0]?.message?.content || "{}",
    );

    // Validate the required fields
    if (
      !parsedPlan.overview ||
      !Array.isArray(parsedPlan.weeklyPlans) ||
      !parsedPlan.recommendations
    ) {
      throw new Error("Missing required fields in plan structure");
    }

    const weeklyPlans = normalizeWeeklyPlans(
      parsedPlan.weeklyPlans,
      daysUntilExam,
    );

    if (weeklyPlans.length === 0) {
      throw new Error("Study plan must include at least one daily task");
    }

    // Create a new StudyPlan instance
    const plan = new StudyPlan({
      userId,
      overview: {
        subject: parsedPlan.overview.subject || subject,
        duration: `${daysUntilExam} days`,
        examDate,
      },
      weeklyPlans,
      recommendations: parsedPlan.recommendations,
      isActive: true,
      progress: 0,
      lastUpdated: new Date(),
    });

    cache.set(cacheKey, plan);
    return plan;
  } catch (error) {
    console.error("Groq error:", error);
    if (error.status === 429 || error.status === 413) {
      const retryAfter = error.headers?.["retry-after"] || 60;
      throw {
        status: error.status,
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        retryAfter,
      };
    }
    throw error;
  }
}

async function webSearch(query) {
  const cacheKey = `websearch_${query}`;
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) return cachedResult;

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        include_answer: "basic",
        max_results: 10,
        topic: "general",
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily web search failed: ${response.status}`);
    }

    const data = await response.json();
    const result = {
      answer: data.answer || null,
      results: (data.results || []).map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content?.slice(0, 300),
        score: r.score,
      })),
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Web search error:", error);
    return { answer: null, results: [] };
  }
}

// Export the functions and rate limiter
export { aiRateLimiter, searchTavily, curateResources, generatePlan, webSearch };
