import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeDelta, formatDuration } from "./utils.js";

describe("computeDelta", () => {
  it("computes deltas for ordered sessions", () => {
    const series = [
      { id: "1", timestamp: "2024-01-01T10:00:00Z", BrestScore: 60 },
      { id: "2", timestamp: "2024-01-02T10:00:00Z", BrestScore: 65 },
      { id: "3", timestamp: "2024-01-03T10:00:00Z", BrestScore: 63 },
    ];

    const result = computeDelta(series);
    assert.deepStrictEqual(result.map((item) => item.deltaBrestScore), [null, 5, -2]);
  });

  it("preserves provided delta values", () => {
    const series = [
      { id: "1", timestamp: "2024-01-01T10:00:00Z", BrestScore: 60, deltaBrestScore: null },
      { id: "2", timestamp: "2024-01-02T10:00:00Z", BrestScore: 65, deltaBrestScore: 4 },
    ];

    const result = computeDelta(series);
    assert.strictEqual(result[1].deltaBrestScore, 4);
  });

  it("returns empty array when input is invalid", () => {
    assert.deepStrictEqual(computeDelta(null), []);
    assert.deepStrictEqual(computeDelta(undefined), []);
  });
});

describe("formatDuration", () => {
  it("formats seconds under an hour", () => {
    assert.strictEqual(formatDuration(900), "15m");
  });

  it("formats hours and minutes", () => {
    assert.strictEqual(formatDuration(3660), "1h 1m");
  });

  it("handles zero and invalid inputs", () => {
    assert.strictEqual(formatDuration(-5), "0m");
    assert.strictEqual(formatDuration(undefined), "0m");
  });
});

