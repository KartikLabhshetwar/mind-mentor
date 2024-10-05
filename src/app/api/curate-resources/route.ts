import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: NextRequest) {
  const { subject } = await req.json();

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Curate a list of 5 free learning resources for ${subject}. For each resource, provide:
  1. The title of the resource
  2. A brief description (1-2 sentences)
  3. The type of resource (e.g., online course, video tutorial, interactive website)
  4. A valid URL to the resource which is working and accessible
  
  Format the response as a JSON array of objects, with each object containing the fields: title, description, type, and link.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let resources;
    try {
      resources = JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      // Attempt to extract JSON from the text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        resources = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to extract valid JSON from the response");
      }
    }

    if (!Array.isArray(resources)) {
      throw new Error("Parsed result is not an array");
    }

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Failed to curate resources. Please try again later." }, { status: 500 });
  }
}