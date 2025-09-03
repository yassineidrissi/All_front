import express from "express";
import { checkOrComputeDeltaMetrics } from "../metrics/deltaCheck.js";

const router = express.Router();

router.post("/api/eval", async (req, res) => {
  const { refs, p0, p1, score } = req.body;
  try {
    const r = await checkOrComputeDeltaMetrics(refs, p0, p1, score);
    res.json(r);
  } catch (err) {
    console.error("/api/eval error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
