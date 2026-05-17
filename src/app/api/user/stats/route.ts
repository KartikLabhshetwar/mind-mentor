import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import StudyStats from "@/models/studyStats";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    const studyStats = await StudyStats.findOne({ userId: session.user.id });
    
    if (!studyStats) {
      return NextResponse.json({
        studySessions: {},
        totalStudyHours: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastStudyDate: null
      });
    }

    // Convert Map to object for JSON response
    const studySessions = Object.fromEntries(studyStats.dailySessions);

    return NextResponse.json({
      studySessions,
      totalStudyHours: studyStats.totalStudyHours,
      currentStreak: studyStats.currentStreak,
      bestStreak: studyStats.bestStreak,
      lastStudyDate: studyStats.lastStudyDate
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
} 