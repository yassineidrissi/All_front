// utils/resultsData.js
// -----------------------------------------------------------------------------
// Lightweight in-memory dataset and helpers powering the Results workspace.
// The project does not yet persist the metrics that drive the dashboards, so we
// provide a mock data layer with deterministic sample content. The helpers
// expose CRUD-like operations that can later be swapped with real database
// queries without touching the route handlers.
// -----------------------------------------------------------------------------

const studentsSeed = [
  { id: "stu-001", name: "Alice Martin" },
  { id: "stu-002", name: "Brahim Cohen" },
  { id: "stu-003", name: "Camille Dubois" },
  { id: "stu-004", name: "Diego Ferreira" },
  { id: "stu-005", name: "Emma Haddad" },
  { id: "stu-006", name: "Farah Idrissi" },
  { id: "stu-007", name: "Gabriel Nguyen" },
  { id: "stu-008", name: "Helena Rossi" },
  { id: "stu-009", name: "Ibrahim Khaled" },
  { id: "stu-010", name: "Jules Laurent" },
];

const sessionSeed = [
  { id: "sess-001", studentId: "stu-001", studentName: "Alice Martin", timestamp: "2024-01-05T09:15:00.000Z", BrestScore: 62, timeSpentSec: 1420 },
  { id: "sess-002", studentId: "stu-001", studentName: "Alice Martin", timestamp: "2024-02-10T13:25:00.000Z", BrestScore: 68, timeSpentSec: 1560 },
  { id: "sess-003", studentId: "stu-001", studentName: "Alice Martin", timestamp: "2024-03-18T16:10:00.000Z", BrestScore: 74, timeSpentSec: 1890 },
  { id: "sess-004", studentId: "stu-002", studentName: "Brahim Cohen", timestamp: "2024-01-08T10:05:00.000Z", BrestScore: 55, timeSpentSec: 1250 },
  { id: "sess-005", studentId: "stu-002", studentName: "Brahim Cohen", timestamp: "2024-02-14T11:45:00.000Z", BrestScore: 60, timeSpentSec: 1380 },
  { id: "sess-006", studentId: "stu-002", studentName: "Brahim Cohen", timestamp: "2024-03-21T15:30:00.000Z", BrestScore: 66, timeSpentSec: 1620 },
  { id: "sess-007", studentId: "stu-003", studentName: "Camille Dubois", timestamp: "2024-01-12T09:40:00.000Z", BrestScore: 71, timeSpentSec: 1760 },
  { id: "sess-008", studentId: "stu-003", studentName: "Camille Dubois", timestamp: "2024-02-16T12:00:00.000Z", BrestScore: 73, timeSpentSec: 1820 },
  { id: "sess-009", studentId: "stu-003", studentName: "Camille Dubois", timestamp: "2024-03-22T14:20:00.000Z", BrestScore: 77, timeSpentSec: 1980 },
  { id: "sess-010", studentId: "stu-004", studentName: "Diego Ferreira", timestamp: "2024-01-18T08:55:00.000Z", BrestScore: 58, timeSpentSec: 1100 },
  { id: "sess-011", studentId: "stu-004", studentName: "Diego Ferreira", timestamp: "2024-02-21T11:10:00.000Z", BrestScore: 64, timeSpentSec: 1400 },
  { id: "sess-012", studentId: "stu-004", studentName: "Diego Ferreira", timestamp: "2024-03-25T15:05:00.000Z", BrestScore: 69, timeSpentSec: 1700 },
  { id: "sess-013", studentId: "stu-005", studentName: "Emma Haddad", timestamp: "2024-01-20T09:05:00.000Z", BrestScore: 66, timeSpentSec: 1500 },
  { id: "sess-014", studentId: "stu-005", studentName: "Emma Haddad", timestamp: "2024-02-25T12:45:00.000Z", BrestScore: 71, timeSpentSec: 1680 },
  { id: "sess-015", studentId: "stu-005", studentName: "Emma Haddad", timestamp: "2024-03-28T16:30:00.000Z", BrestScore: 76, timeSpentSec: 1920 },
  { id: "sess-016", studentId: "stu-006", studentName: "Farah Idrissi", timestamp: "2024-01-24T10:20:00.000Z", BrestScore: 63, timeSpentSec: 1360 },
  { id: "sess-017", studentId: "stu-006", studentName: "Farah Idrissi", timestamp: "2024-02-28T14:55:00.000Z", BrestScore: 67, timeSpentSec: 1490 },
  { id: "sess-018", studentId: "stu-006", studentName: "Farah Idrissi", timestamp: "2024-04-01T17:40:00.000Z", BrestScore: 72, timeSpentSec: 1710 },
  { id: "sess-019", studentId: "stu-007", studentName: "Gabriel Nguyen", timestamp: "2024-01-28T09:35:00.000Z", BrestScore: 59, timeSpentSec: 1200 },
  { id: "sess-020", studentId: "stu-007", studentName: "Gabriel Nguyen", timestamp: "2024-03-03T13:15:00.000Z", BrestScore: 63, timeSpentSec: 1485 },
  { id: "sess-021", studentId: "stu-007", studentName: "Gabriel Nguyen", timestamp: "2024-04-07T16:50:00.000Z", BrestScore: 68, timeSpentSec: 1660 },
  { id: "sess-022", studentId: "stu-008", studentName: "Helena Rossi", timestamp: "2024-02-02T08:45:00.000Z", BrestScore: 72, timeSpentSec: 1750 },
  { id: "sess-023", studentId: "stu-008", studentName: "Helena Rossi", timestamp: "2024-03-08T11:20:00.000Z", BrestScore: 78, timeSpentSec: 1925 },
  { id: "sess-024", studentId: "stu-008", studentName: "Helena Rossi", timestamp: "2024-04-12T15:55:00.000Z", BrestScore: 83, timeSpentSec: 2100 },
  { id: "sess-025", studentId: "stu-009", studentName: "Ibrahim Khaled", timestamp: "2024-02-06T09:10:00.000Z", BrestScore: 61, timeSpentSec: 1320 },
  { id: "sess-026", studentId: "stu-009", studentName: "Ibrahim Khaled", timestamp: "2024-03-12T12:40:00.000Z", BrestScore: 66, timeSpentSec: 1515 },
  { id: "sess-027", studentId: "stu-009", studentName: "Ibrahim Khaled", timestamp: "2024-04-16T17:05:00.000Z", BrestScore: 70, timeSpentSec: 1740 },
  { id: "sess-028", studentId: "stu-010", studentName: "Jules Laurent", timestamp: "2024-02-10T10:30:00.000Z", BrestScore: 58, timeSpentSec: 1180 },
  { id: "sess-029", studentId: "stu-010", studentName: "Jules Laurent", timestamp: "2024-03-15T14:00:00.000Z", BrestScore: 63, timeSpentSec: 1440 },
  { id: "sess-030", studentId: "stu-010", studentName: "Jules Laurent", timestamp: "2024-04-19T18:35:00.000Z", BrestScore: 69, timeSpentSec: 1695 },
];

let students = [...studentsSeed];
let sessions = [...sessionSeed];

const clone = (value) => JSON.parse(JSON.stringify(value));

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const withinRange = (session, from, to) => {
  const ts = new Date(session.timestamp);
  if (Number.isNaN(ts.getTime())) return false;
  if (from && ts < from) return false;
  if (to && ts > to) return false;
  return true;
};

export const getAllStudents = () => clone(students);

export const getAllSessions = () => clone(sessions);

export const getSessionsFiltered = ({ from, to } = {}) => {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  return sessions.filter((session) => withinRange(session, fromDate, toDate));
};

export const getStudentsWithLastActivity = () => {
  const lastActivityMap = new Map();
  sessions.forEach((session) => {
    const current = lastActivityMap.get(session.studentId);
    if (!current || new Date(session.timestamp) > new Date(current)) {
      lastActivityMap.set(session.studentId, session.timestamp);
    }
  });

  return students.map((student) => ({
    ...student,
    lastActivity: lastActivityMap.get(student.id) || null,
  }));
};

export const getStudentById = (id) => clone(students.find((student) => student.id === id) || null);

export const getStudentSessions = (studentId) =>
  clone(
    sessions
      .filter((session) => session.studentId === studentId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  );

export const upsertStudent = (student) => {
  const index = students.findIndex((item) => item.id === student.id);
  if (index >= 0) {
    students[index] = { ...students[index], ...student };
  } else {
    students.push({ ...student });
  }
};

export const replaceSessions = (nextSessions) => {
  sessions = [...nextSessions];
};

export const deleteSessions = (idsToDelete = []) => {
  const idSet = new Set(idsToDelete);
  const before = sessions.length;
  sessions = sessions.filter((session) => !idSet.has(session.id));
  return before - sessions.length;
};

export const resetResultsData = () => {
  students = [...studentsSeed];
  sessions = [...sessionSeed];
};

export const computeDeltaSeries = (series) => {
  let previousScore = null;
  return series.map((item) => {
    const delta =
      typeof item.deltaBrestScore === "number"
        ? item.deltaBrestScore
        : previousScore === null
        ? null
        : Number(item.BrestScore) - previousScore;
    previousScore = Number(item.BrestScore);
    return { ...item, deltaBrestScore: delta };
  });
};

export const aggregateSummary = ({ from, to } = {}) => {
  const filtered = getSessionsFiltered({ from, to });
  const uniqueStudents = new Set(filtered.map((session) => session.studentId));
  const totalSessions = filtered.length;
  const avgBrestScore =
    totalSessions === 0
      ? 0
      : filtered.reduce((sum, session) => sum + Number(session.BrestScore || 0), 0) / totalSessions;

  const deltaValues = [];
  const deltaByStudent = new Map();
  uniqueStudents.forEach((studentId) => {
    const studentSessions = computeDeltaSeries(
      filtered
        .filter((session) => session.studentId === studentId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    );

    const deltas = studentSessions
      .map((session) => session.deltaBrestScore)
      .filter((value) => typeof value === "number");

    deltas.forEach((value) => deltaValues.push(value));
    if (deltas.length > 0) {
      const average = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
      deltaByStudent.set(studentSessions[0].studentId, {
        studentId: studentSessions[0].studentId,
        name: studentSessions[0].studentName,
        avgDelta: average,
      });
    }
  });

  const avgDeltaBrestScore = deltaValues.length
    ? deltaValues.reduce((sum, value) => sum + value, 0) / deltaValues.length
    : 0;

  const totalTimeSec = filtered.reduce((sum, session) => sum + Number(session.timeSpentSec || 0), 0);

  const busiestDaysMap = new Map();
  filtered.forEach((session) => {
    const dayKey = new Date(session.timestamp).toISOString().split("T")[0];
    busiestDaysMap.set(dayKey, (busiestDaysMap.get(dayKey) || 0) + 1);
  });

  const busiestDays = Array.from(busiestDaysMap.entries())
    .map(([date, sessionsCount]) => ({ date, sessions: sessionsCount }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const timeByStudentMap = new Map();
  filtered.forEach((session) => {
    const key = session.studentId;
    const current = timeByStudentMap.get(key) || {
      studentId: key,
      name: session.studentName,
      totalTimeSec: 0,
    };
    current.totalTimeSec += Number(session.timeSpentSec || 0);
    timeByStudentMap.set(key, current);
  });

  const timeDistribution = Array.from(timeByStudentMap.values()).sort(
    (a, b) => b.totalTimeSec - a.totalTimeSec
  );

  const topImprovers = Array.from(deltaByStudent.values()).sort((a, b) => b.avgDelta - a.avgDelta);

  return {
    totalStudents: uniqueStudents.size,
    totalSessions,
    avgBrestScore,
    avgDeltaBrestScore,
    totalTimeSec,
    topImprovers,
    busiestDays,
    timeDistribution,
  };
};

export const performDeletion = ({ scope, studentId, from, to }) => {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);

  let candidates = [];
  if (scope === "all") {
    candidates = [...sessions];
  } else if (scope === "student" && studentId) {
    candidates = sessions.filter((session) => session.studentId === studentId);
  } else if (scope === "dateRange") {
    candidates = sessions.filter((session) => withinRange(session, fromDate, toDate));
  }

  const matchedCount = candidates.length;
  const sample = clone(candidates.slice(0, 5));

  if (matchedCount === 0) {
    return { matchedCount: 0, deletedCount: 0, sample, warnings: ["No sessions matched the criteria."] };
  }

  const ids = candidates.map((session) => session.id);
  const deletedCount = deleteSessions(ids);

  const warnings = [];
  if (scope === "student" && studentId && !sessions.some((session) => session.studentId === studentId)) {
    warnings.push("Selected student no longer has sessions.");
  }

  if (scope === "all") {
    warnings.push("All session metrics have been removed from the mock dataset.");
  }

  return { matchedCount, deletedCount, sample, warnings };
};

