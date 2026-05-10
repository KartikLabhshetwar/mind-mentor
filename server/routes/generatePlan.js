import express from "express";
import * as generatePlanController from "../controllers/generatePlanController.js";

const router = express.Router();

// Get plans for a user
router.get("/:userId", generatePlanController.getPlans);

// Create new plan
router.post("/", generatePlanController.createPlan);

// Update task completion status
router.patch("/:planId/task", generatePlanController.updateTask);

// Delete a plan
router.delete("/:planId", generatePlanController.deletePlan);

export default router;
