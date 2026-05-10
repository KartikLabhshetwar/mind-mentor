import studyPlanService from '../services/studyPlanService.js';

export const getPlans = async (req, res) => {
  try {
    const plans = await studyPlanService.getUserPlans(req.params.userId);
    res.json({ success: true, plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(error.status || 400).json({
      success: false,
      error: error.code || "SERVER_ERROR",
      message: error.message || "Failed to fetch plans"
    });
  }
};

export const createPlan = async (req, res) => {
  try {
    const { subject, examDate, userId } = req.body;
    const plan = await studyPlanService.createStudyPlan(subject, examDate, userId);
    res.json({ success: true, plan });
  } catch (error) {
    console.error("Error in plan generation:", error);
    res.status(error.status || 400).json({
      success: false,
      error: error.code || "SERVER_ERROR",
      message: error.message || "Plan generation failed"
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { planId } = req.params;
    const { weekIndex, dayIndex, taskIndex, completed } = req.body;
    const plan = await studyPlanService.updatePlanTask(planId, weekIndex, dayIndex, taskIndex, completed);
    res.json({ success: true, plan });
  } catch (error) {
    console.error("Error updating task completion:", error);
    res.status(error.status || 400).json({
      success: false,
      error: error.code || "SERVER_ERROR",
      message: error.message || "Failed to update task completion"
    });
  }
};

export const deletePlan = async (req, res) => {
  try {
    await studyPlanService.deletePlan(req.params.planId);
    res.json({ success: true, message: "Study plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(error.status || 400).json({
      success: false,
      error: error.code || "SERVER_ERROR",
      message: error.message || "Failed to delete plan"
    });
  }
};
