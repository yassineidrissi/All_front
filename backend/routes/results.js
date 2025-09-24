import express from "express";
import {
  aggregateSummary,
  computeDeltaSeries,
  getAllSessions,
  getStudentById,
  getStudentSessions,
  getStudentsWithLastActivity,
  performDeletion,
} from "../utils/resultsData.js";

const router = express.Router();

const parseRangeParams = (req) => {
  const { from, to } = req.query;
  return { from, to };
};

router.get("/metrics/summary", (req, res) => {
  try {
    const { from, to } = parseRangeParams(req);
    const summary = aggregateSummary({ from, to });

    const totalTimeHours = summary.totalTimeSec / 3600;
    const timeDistribution = summary.timeDistribution.map((entry) => ({
      studentId: entry.studentId,
      name: entry.name,
      totalTimeSec: entry.totalTimeSec,
    }));

    return res.json({
      totalStudents: summary.totalStudents,
      totalSessions: summary.totalSessions,
      avgBrestScore: summary.avgBrestScore,
      avgDeltaBrestScore: summary.avgDeltaBrestScore,
      totalTimeHours,
      topImprovers: summary.topImprovers,
      busiestDays: summary.busiestDays,
      timeDistribution,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error while building metrics summary", error);
    return res.status(500).json({ message: "Unable to compute summary metrics." });
  }
});

router.get("/students", (req, res) => {
  try {
    const query = (req.query.query || "").toString().toLowerCase();
    const students = getStudentsWithLastActivity()
      .filter((student) =>
        query
          ? student.name.toLowerCase().includes(query) || student.id.toLowerCase().includes(query)
          : true
      )
      .map((student) => ({
        id: student.id,
        name: student.name,
        lastActivity: student.lastActivity,
      }));

    return res.json(students);
  } catch (error) {
    console.error("Error while listing students", error);
    return res.status(500).json({ message: "Unable to load students." });
  }
});

router.get("/students/:id/series", (req, res) => {
  try {
    const { id } = req.params;
    const student = getStudentById(id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const seriesRaw = getStudentSessions(id);
    const series = computeDeltaSeries(seriesRaw);

    return res.json({
      student,
      series,
      totalSessions: series.length,
    });
  } catch (error) {
    console.error("Error while reading student series", error);
    return res.status(500).json({ message: "Unable to load student sessions." });
  }
});

router.delete("/data", (req, res) => {
  try {
    const { scope, studentId, from, to, dryRun } = req.body || {};

    if (!scope || !["all", "student", "dateRange"].includes(scope)) {
      return res.status(400).json({ message: "A valid scope is required." });
    }

    if (scope === "student" && !studentId) {
      return res.status(400).json({ message: "studentId is required for student scoped deletions." });
    }

    if (scope === "dateRange" && (!from || !to)) {
      return res.status(400).json({ message: "from and to dates are required for date range deletions." });
    }

    const allSessions = getAllSessions();
    let matched = [];

    if (scope === "all") {
      matched = allSessions;
    } else if (scope === "student") {
      matched = allSessions.filter((session) => session.studentId === studentId);
    } else {
      matched = allSessions.filter((session) => {
        const ts = new Date(session.timestamp);
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;
        if (Number.isNaN(ts.getTime())) return false;
        if (fromDate && ts < fromDate) return false;
        if (toDate && ts > toDate) return false;
        return true;
      });
    }

    if (dryRun !== false) {
      return res.json({
        matchedCount: matched.length,
        deletedCount: 0,
        warnings: matched.length === 0 ? ["No sessions matched the criteria."] : undefined,
        sample: matched.slice(0, 5),
      });
    }

    const result = performDeletion({ scope, studentId, from, to });
    return res.json(result);
  } catch (error) {
    console.error("Error while deleting data", error);
    return res.status(500).json({ message: "Unable to delete data." });
  }
});

export default router;

