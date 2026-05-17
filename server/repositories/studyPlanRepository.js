import StudyPlan from '../models/studyPlan.js';

class StudyPlanRepository {
  async findUserPlans(userId) {
    return StudyPlan.find({ userId, isActive: true }).sort({ createdAt: -1 });
  }

  async findActivePlanBySubject(userId, normalizedSubject) {
    return StudyPlan.findOne({
      userId,
      "overview.subject": { $regex: new RegExp(`^${normalizedSubject}$`, "i") },
      isActive: true,
    });
  }

  async findById(planId) {
    return StudyPlan.findById(planId);
  }

  async deactivatePlan(planId) {
    return StudyPlan.findByIdAndUpdate(
      planId,
      { isActive: false },
      { new: true }
    );
  }

  async savePlan(planData) {
    const plan = new StudyPlan(planData);
    return plan.save();
  }
}

export default new StudyPlanRepository();
