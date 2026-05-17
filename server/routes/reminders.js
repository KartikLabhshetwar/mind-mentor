import express from "express";
import mongoose from "mongoose";
import { validateAgentAuth } from "../middleware/agentAuth.js";
import ReminderPreferences from "../models/reminderPreferences.js";

const router = express.Router();
router.use(validateAgentAuth);

router.post("/preferences", async (req, res) => {
  try {
    const { userId, ...prefs } = req.body;
    const result = await ReminderPreferences.findOneAndUpdate(
      { userId },
      { userId, ...prefs },
      { upsert: true, new: true }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

router.get("/preferences/:userId", async (req, res) => {
  try {
    const prefs = await ReminderPreferences.findOne({ userId: req.params.userId });
    res.json(prefs || { enabled: false });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

router.get("/active-users", async (req, res) => {
  try {
    const User = mongoose.model("User");
    const prefs = await ReminderPreferences.find({ "dailyReminder.enabled": true });
    const userIds = prefs.map(p => p.userId);
    const users = await User.find({ _id: { $in: userIds } }, "name email");

    const result = prefs.map(pref => {
      const user = users.find(u => u._id.toString() === pref.userId.toString());
      return { userId: pref.userId, email: pref.email || user?.email, name: user?.name || "Student", preferences: pref };
    });

    res.json({ users: result });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch active users" });
  }
});

export default router;
