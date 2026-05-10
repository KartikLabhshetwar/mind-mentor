import studyPlanRepository from '../repositories/studyPlanRepository.js';
import { generatePlan } from './aiService.js';

class StudyPlanService {
  async getUserPlans(userId) {
    if (!userId) throw new Error('userId is required');
    return studyPlanRepository.findUserPlans(userId);
  }

  async createStudyPlan(subject, examDate, userId) {
    if (!subject?.trim() || !examDate || !userId) {
      const error = new Error('Subject, examDate and userId are required');
      error.code = 'INVALID_INPUT';
      throw error;
    }

    const normalizedSubject = subject.trim().toLowerCase().replace(/\s+/g, " ");
    const existingPlan = await studyPlanRepository.findActivePlanBySubject(userId, normalizedSubject);

    if (existingPlan) {
      const error = new Error(`You already have an active study plan for ${subject}. Please check your existing plans or deactivate the current one before creating a new plan.`);
      error.code = 'PLAN_EXISTS';
      throw error;
    }

    const planData = await generatePlan(subject, userId, examDate);
    // aiService.generatePlan likely returns a Mongoose document. 
    // To keep it clean, we should just save it using repository if it returns raw data, 
    // but if generatePlan returns a document, we can just call .save() on it or let repo handle it.
    // Assuming aiService.generatePlan returns a new StudyPlan instance without saving:
    return planData.save();
  }

  async updatePlanTask(planId, weekIndex, dayIndex, taskIndex, completed) {
    if (
      typeof weekIndex !== "number" ||
      typeof dayIndex !== "number" ||
      typeof taskIndex !== "number" ||
      typeof completed !== "boolean"
    ) {
      const error = new Error('weekIndex, dayIndex, taskIndex and completed boolean are required');
      error.code = 'INVALID_INPUT';
      throw error;
    }

    const plan = await studyPlanRepository.findById(planId);
    if (!plan) {
      const error = new Error('Study plan not found');
      error.code = 'PLAN_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    const weeklyPlan = plan.weeklyPlans[weekIndex];
    if (!weeklyPlan) throw Object.assign(new Error('Invalid week index'), { code: 'INVALID_INPUT' });

    const dailyTask = weeklyPlan.dailyTasks[dayIndex];
    if (!dailyTask) throw Object.assign(new Error('Invalid day index'), { code: 'INVALID_INPUT' });

    const task = dailyTask.tasks[taskIndex];
    if (!task) throw Object.assign(new Error('Invalid task index'), { code: 'INVALID_INPUT' });

    if (typeof task === "string") {
      dailyTask.tasks[taskIndex] = { text: task, completed };
    } else {
      dailyTask.tasks[taskIndex].completed = completed;
    }

    const allTasks = plan.weeklyPlans.flatMap((week) =>
      week.dailyTasks.flatMap((day) => day.tasks),
    );
    const completedTasks = allTasks.filter((t) =>
      typeof t !== "string" ? t.completed : false,
    ).length;
    const totalTasks = allTasks.length;
    plan.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    plan.lastUpdated = new Date();

    return plan.save();
  }

  async deletePlan(planId) {
    if (!planId) {
      const error = new Error('Plan ID is required');
      error.code = 'INVALID_INPUT';
      throw error;
    }

    const updatedPlan = await studyPlanRepository.deactivatePlan(planId);
    
    if (!updatedPlan) {
      const error = new Error('Study plan not found');
      error.code = 'PLAN_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    return updatedPlan;
  }
}

export default new StudyPlanService();
