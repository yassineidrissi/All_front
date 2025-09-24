/**
 * Utilities for the Results workspace. Pure functions live here so they can be
 * unit tested and reused across pages.
 */

/**
 * Computes the delta Brest score for a chronologically sorted series. If the
 * API already provides a delta value it is preserved; otherwise it is derived
 * from the previous session score. The first session in the series has a delta
 * of null.
 *
 * @param {Array<{ timestamp: string; BrestScore: number; deltaBrestScore?: number }>} series
 * @returns {Array}
 */
export function computeDelta(series) {
  if (!Array.isArray(series)) {
    return [];
  }

  let previousScore = null;
  return series
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((session, index) => {
      const explicitDelta =
        typeof session.deltaBrestScore === "number" && Number.isFinite(session.deltaBrestScore)
          ? session.deltaBrestScore
          : null;

      const computedDelta =
        explicitDelta !== null
          ? explicitDelta
          : previousScore === null
          ? null
          : Number(session.BrestScore) - previousScore;

      previousScore = Number(session.BrestScore);
      return {
        ...session,
        deltaBrestScore: computedDelta,
        index,
      };
    });
}

/**
 * Formats a duration expressed in seconds to "Hh Mm". Seconds are rounded to
 * the nearest minute to keep the UI readable.
 *
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0m";
  }

  const rounded = Math.round(seconds / 60);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

/**
 * Formats an ISO timestamp to a human readable date.
 * @param {string} iso
 * @returns {string}
 */
export function formatDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Formats an ISO timestamp to a readable datetime.
 * @param {string} iso
 * @returns {string}
 */
export function formatDateTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Formats a Brest score with one decimal place.
 * @param {number} value
 * @returns {string}
 */
export function formatScore(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return Number(value).toFixed(1);
}

/**
 * Exports an array of objects to CSV and triggers a download.
 * @param {Array<Record<string, any>>} rows
 * @param {string} filename
 */
export function exportToCsv(rows, filename = "sessions.csv") {
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(",")];

  rows.forEach((row) => {
    const values = headers.map((key) => {
      const raw = row[key] ?? "";
      const value = typeof raw === "string" ? raw : JSON.stringify(raw);
      return `"${value.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Computes a rolling sum by student for the time spent chart and splits the
 * array into top entries plus an optional "Autres" bucket.
 *
 * @param {Array<{ studentId: string; name: string; totalTimeSec: number }>} data
 * @param {number} maxEntries
 */
export function buildTimeDistribution(data, maxEntries = 6) {
  if (!Array.isArray(data)) return [];
  const sorted = data.slice().sort((a, b) => b.totalTimeSec - a.totalTimeSec);
  const top = sorted.slice(0, maxEntries);
  const rest = sorted.slice(maxEntries);
  const othersTotal = rest.reduce((sum, item) => sum + (item.totalTimeSec || 0), 0);
  if (othersTotal > 0) {
    top.push({ studentId: "others", name: "Autres", totalTimeSec: othersTotal });
  }
  return top;
}

