import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: NextRequest) {
  const { subject, examDate } = await req.json();

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const currentDate = new Date().toISOString().split('T')[0];
  const daysUntilExam = Math.ceil((new Date(examDate).getTime() - new Date(currentDate).getTime()) / (1000 * 3600 * 24));

  if (daysUntilExam < 0) {
    return NextResponse.json({ error: "Exam date must be in the future" }, { status: 400 });
  }

  const prompt = `Generate a detailed study plan for ${subject} starting from today (${currentDate}) until the exam date (${examDate}), which is in ${daysUntilExam} days. 
  Break down the plan into weekly goals and daily tasks. 
  Ensure the plan is realistic and adaptable to the given timeframe. 
  Format the response with clear headings and bullet points for easy readability.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  // Remove any remaining asterisks from the text
  text = text.replace(/\*/g, '');

  return NextResponse.json({ plan: text });
}