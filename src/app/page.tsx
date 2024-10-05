"use client"
import StudyPlanForm from '../components/StudyPlanForm';
import ResourceCurator from '../components/ResourceCurator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl">Mind Mentor</CardTitle>
          <CardDescription>Generate study plans, find resources, and get answers to your questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <StudyPlanForm />
          <ResourceCurator />
        </CardContent>
      </Card>
    </div>
  );
}