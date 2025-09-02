// Utility functions for variable measurements
// Provides calculation helpers for latency, engagement, and reflective feedback metrics.

/**
 * Count tokens/words in a prompt.
 * Simple whitespace split. Replace with tokenizer for precision.
 * @param {string} prompt
 * @returns {number}
 */
export function countPromptTokens(prompt = "") {
  return prompt.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Classify prompt structure.
 * Returns 'question', 'stepwise', or 'narrative'.
 * @param {string} prompt
 * @returns {string}
 */
export function classifyPromptStructure(prompt = "") {
  const stepwiseRegex = /\d+\./;
  if (stepwiseRegex.test(prompt)) return "stepwise";
  if (prompt.includes("?")) return "question";
  return "narrative";
}

/**
 * Time to First Token (TFFT).
 * Difference between prompt submission and first token in ms.
 * @param {number} promptSent
 * @param {number} responseStart
 * @returns {number}
 */
export function timeToFirstToken(promptSent, responseStart) {
  return responseStart - promptSent;
}

/**
 * Compute IPQ score from array of item responses (0-6).
 * @param {number[]} items
 * @returns {number}
 */
export function computeIPQ(items = []) {
  const valid = items.filter((n) => typeof n === "number");
  if (valid.length === 0) return 0;
  const sum = valid.reduce((a, b) => a + b, 0);
  return sum / valid.length;
}

/**
 * Average exchange duration.
 * @param {number} firstTimestamp
 * @param {number} lastTimestamp
 * @param {number} turnCount
 * @returns {number}
 */
export function averageExchangeDuration(firstTimestamp, lastTimestamp, turnCount) {
  return (lastTimestamp - firstTimestamp) / Math.max(turnCount, 1);
}

/**
 * Count context breaks given similarity scores and a threshold.
 * @param {number[]} similarities
 * @param {number} threshold
 * @returns {number}
 */
export function countContextBreaks(similarities = [], threshold = 0.5) {
  return similarities.filter((s) => s < threshold).length;
}

/**
 * Count interruptions from an array of events.
 * Event format: { type: 'typing'|'submit'|'cancel' }
 * @param {Array<{type:string}>} events
 * @returns {number}
 */
export function countInterruptions(events = []) {
  return events.filter((e) => e.type === "cancel" || e.type === "overlap").length;
}

/**
 * Compute BERTScore or BLEURT similarity.
 * This function expects external libraries to be installed.
 * Returns null if libraries are unavailable.
 * @param {string} candidate
 * @param {string} reference
 * @returns {Promise<number|null>}
 */
export async function computeSemanticSimilarity(candidate, reference) {
  try {
    const { score } = await import("bert-score");
    const result = await score([candidate], [reference]);
    return result.f1[0];
  } catch (err) {
    console.warn("bert-score not available, returning null");
    return null;
  }
}

/**
 * Compute re-elaboration time in milliseconds.
 * @param {number} optimizedResponseTime
 * @param {number} revisedPromptTime
 * @returns {number}
 */
export function reElaborationTime(optimizedResponseTime, revisedPromptTime) {
  return revisedPromptTime - optimizedResponseTime;
}

export default {
  countPromptTokens,
  classifyPromptStructure,
  timeToFirstToken,
  computeIPQ,
  averageExchangeDuration,
  countContextBreaks,
  countInterruptions,
  computeSemanticSimilarity,
  reElaborationTime,
};

