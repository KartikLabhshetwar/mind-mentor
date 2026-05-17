import express from "express";
import ReminderPreferences from "../models/reminderPreferences.js";

const router = express.Router();

router.post("/resend", async (req, res) => {
  const { type, data } = req.body;
  try {
    if (type === "email.opened" || type === "email.clicked") {
      await ReminderPreferences.updateOne(
        { email: data.to?.[0] || data.to },
        { $set: { consecutiveIgnored: 0 } }
      );
    }
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
