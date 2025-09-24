import pool from "../db.js";

/**
 * Parse an incoming date/time filter into an ISO string accepted by PostgreSQL.
 * Invalid values resolve to null so the SQL filter ignores that bound.
 *
 * @param {string | undefined} value
 * @returns {string | null}
 */
const parseDateParam = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const normalizeStudentId = (value) =>
  value === null || value === undefined ? "" : value.toString();

/**
 * Build a chronological series with delta computation for a list of sessions.
 *
 * @param {Array<{
 *   id: string;
 *   user_id: string;
 *   user_name: string | null;
 *   created_at: Date | string;
 *   computed_score: number | null;
 *   time_spent_seconds: number | null;
 * }>} rows
 * @returns {{
 *   series: Array<{
 *     id: string;
 *     studentId: string;
 *     studentName: string;
 *     timestamp: string;
 *     BrestScore: number | null;
 *     timeSpentSec: number;
 *     deltaBrestScore: number | null;
 *   }>;
 * }}
 */
const buildSeriesWithDelta = (rows) => {
  let previousScore = null;
  let lastStudentId = null;

  const series = rows.map((row) => {
    const studentId = normalizeStudentId(row.user_id);
    const studentName = row.user_name || "Unknown Student";
    if (studentId !== lastStudentId) {
      previousScore = null;
      lastStudentId = studentId;
    }
    const sessionId = row.id === null || row.id === undefined ? "" : row.id.toString();
    const timestamp = row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString();

    const hasScore =
      row.computed_score !== null && row.computed_score !== undefined;
    const BrestScore = hasScore ? Number(row.computed_score) : null;
    const timeSpentSec = row.time_spent_seconds === null || row.time_spent_seconds === undefined
      ? 0
      : Number(row.time_spent_seconds);

    let deltaBrestScore = null;
    if (hasScore && !Number.isNaN(BrestScore)) {
      if (previousScore !== null) {
        deltaBrestScore = BrestScore - previousScore;
      }
      previousScore = BrestScore;
    }

    return {
      id: sessionId,
      studentId,
      studentName,
      timestamp,
      BrestScore: hasScore && !Number.isNaN(BrestScore) ? BrestScore : null,
      timeSpentSec: Number.isNaN(timeSpentSec) ? 0 : timeSpentSec,
      deltaBrestScore,
    };
  });

  return { series };
};

/**
 * Fetch dashboard summary metrics from PostgreSQL.
 *
 * @param {{ from?: string; to?: string }} params
 * @returns {Promise<{
 *   totalStudents: number;
 *   totalSessions: number;
 *   avgBrestScore: number;
 *   avgDeltaBrestScore: number;
 *   totalTimeHours: number;
 *   topImprovers: Array<{ studentId: string; name: string; avgDelta: number }>;
 *   busiestDays: Array<{ date: string; sessions: number }>;
 *   timeDistribution: Array<{ studentId: string; name: string; totalTimeSec: number }>;
 * }>}
 */
export const fetchSummary = async ({ from, to } = {}) => {
  const fromParam = parseDateParam(from);
  const toParam = parseDateParam(to);

  const { rows } = await pool.query(
    `SELECT s.id, s.user_id, s.created_at,
            CASE
              WHEN s.time_spent_seconds IS NOT NULL AND s.time_spent_seconds > 0
                THEN LEAST(100, GREATEST(0, ROUND(s.time_spent_seconds / 10.0)))
              ELSE NULL
            END AS computed_score,
            s.time_spent_seconds, u.name AS user_name
     FROM simulation_sessions s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE ($1::timestamptz IS NULL OR s.created_at >= $1)
       AND ($2::timestamptz IS NULL OR s.created_at <= $2)
     ORDER BY s.user_id ASC, s.created_at ASC`,
    [fromParam, toParam]
  );

  if (rows.length === 0) {
    return {
      totalStudents: 0,
      totalSessions: 0,
      avgBrestScore: 0,
      avgDeltaBrestScore: 0,
      totalTimeHours: 0,
      topImprovers: [],
      busiestDays: [],
      timeDistribution: [],
    };
  }

  const uniqueStudents = new Map();
  let totalTimeSec = 0;
  let brestScoreSum = 0;
  let brestScoreCount = 0;
  let globalDeltaSum = 0;
  let globalDeltaCount = 0;

  const busiestDaysMap = new Map();
  const timeDistributionMap = new Map();
  const deltaByStudent = new Map();

  let currentStudentId = null;
  let previousScoreByStudent = null;

  rows.forEach((row) => {
    const studentId = normalizeStudentId(row.user_id);
    const studentName = row.user_name || "Unknown Student";
    uniqueStudents.set(studentId, studentName);

    const timestamp = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
    if (!Number.isNaN(timestamp.getTime())) {
      const dayKey = timestamp.toISOString().split("T")[0];
      busiestDaysMap.set(dayKey, (busiestDaysMap.get(dayKey) || 0) + 1);
    }

    const rawTime = row.time_spent_seconds;
    const timeSpent = rawTime === null || rawTime === undefined ? 0 : Number(rawTime);
    if (!Number.isNaN(timeSpent)) {
      totalTimeSec += timeSpent;
      const current = timeDistributionMap.get(studentId) || {
        studentId,
        name: studentName,
        totalTimeSec: 0,
      };
      current.totalTimeSec += timeSpent;
      timeDistributionMap.set(studentId, current);
    }

    const hasScore =
      row.computed_score !== null && row.computed_score !== undefined;
    const score = hasScore ? Number(row.computed_score) : null;
    if (hasScore && score !== null && !Number.isNaN(score)) {
      brestScoreSum += score;
      brestScoreCount += 1;
    }

    if (currentStudentId !== studentId) {
      currentStudentId = studentId;
      previousScoreByStudent = null;
    }

    if (hasScore && score !== null && !Number.isNaN(score)) {
      if (previousScoreByStudent !== null) {
        const delta = score - previousScoreByStudent;
        globalDeltaSum += delta;
        globalDeltaCount += 1;

        const aggregate = deltaByStudent.get(studentId) || {
          studentId,
          name: studentName,
          sum: 0,
          count: 0,
        };
        aggregate.sum += delta;
        aggregate.count += 1;
        deltaByStudent.set(studentId, aggregate);
      }
      previousScoreByStudent = score;
    }
  });

  const topImprovers = Array.from(deltaByStudent.values())
    .filter((entry) => entry.count > 0)
    .map((entry) => ({
      studentId: entry.studentId,
      name: entry.name,
      avgDelta: entry.sum / entry.count,
    }))
    .sort((a, b) => b.avgDelta - a.avgDelta);

  const busiestDays = Array.from(busiestDaysMap.entries())
    .map(([date, sessions]) => ({ date, sessions }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const timeDistribution = Array.from(timeDistributionMap.values()).sort(
    (a, b) => b.totalTimeSec - a.totalTimeSec
  );

  return {
    totalStudents: uniqueStudents.size,
    totalSessions: rows.length,
    avgBrestScore: brestScoreCount ? brestScoreSum / brestScoreCount : 0,
    avgDeltaBrestScore: globalDeltaCount ? globalDeltaSum / globalDeltaCount : 0,
    totalTimeHours: totalTimeSec / 3600,
    topImprovers,
    busiestDays,
    timeDistribution,
  };
};

/**
 * Fetch searchable students with their last activity timestamp.
 *
 * @param {{ query?: string }} params
 * @returns {Promise<Array<{ id: string; name: string; lastActivity: string | null }>>}
 */
export const fetchStudents = async ({ query } = {}) => {
  const search = query ? query.toString().trim() : "";
  const values = [];

  let sql = `SELECT u.id, u.name, MAX(s.created_at) AS last_activity
    FROM users u
    LEFT JOIN simulation_sessions s ON s.user_id = u.id
    WHERE u.is_active = true`;

  if (search) {
    values.push(`%${search}%`);
    sql += ` AND (u.name ILIKE $1 OR u.id::text ILIKE $1)`;
  }

  sql += " GROUP BY u.id, u.name ORDER BY u.name ASC";

  const { rows } = await pool.query(sql, values);

  return rows.map((row) => ({
    id: normalizeStudentId(row.id),
    name: row.name,
    lastActivity: row.last_activity ? new Date(row.last_activity).toISOString() : null,
  }));
};

/**
 * Fetch a student's session series with delta computation.
 *
 * @param {string} studentId
 * @returns {Promise<{
 *   student: { id: string; name: string };
 *   series: Array<{
 *     id: string;
 *     studentId: string;
 *     studentName: string;
 *     timestamp: string;
 *     BrestScore: number | null;
 *     timeSpentSec: number;
 *     deltaBrestScore: number | null;
 *   }>;
 *   totalSessions: number;
 * } | null>}
 */
export const fetchStudentSeries = async (studentId) => {
  const studentResult = await pool.query(
    "SELECT id, name FROM users WHERE id = $1 AND is_active = true",
    [studentId]
  );

  const student = studentResult.rows[0];
  if (!student) {
    return null;
  }

  const { rows } = await pool.query(
    `SELECT s.id, s.user_id, s.created_at,
            CASE
              WHEN s.time_spent_seconds IS NOT NULL AND s.time_spent_seconds > 0
                THEN LEAST(100, GREATEST(0, ROUND(s.time_spent_seconds / 10.0)))
              ELSE NULL
            END AS computed_score,
            s.time_spent_seconds, u.name AS user_name
     FROM simulation_sessions s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.user_id = $1
     ORDER BY s.created_at ASC`,
    [studentId]
  );

  const { series } = buildSeriesWithDelta(rows);

  return {
    student: { id: normalizeStudentId(student.id), name: student.name },
    series,
    totalSessions: series.length,
  };
};
