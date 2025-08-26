/**
 * Calculate a quality score for a prompt based on various factors
 * @param {string} prompt - The user prompt
 * @param {string} response - The AI response
 * @returns {number} Score between 0 and 1
 */
export function calculatePromptScore(prompt, response) {
  // Simple but more realistic scoring algorithm
  let score = 0.5; // Base score
  
  // Length factors
  if (prompt.length > 10) score += 0.1;
  if (prompt.length > 20) score += 0.1;
  if (prompt.includes('?')) score += 0.1;
  
  // Content factors
  const medicalTerms = ['symptômes', 'diagnostic', 'traitement', 'maladie', 'fièvre', 'douleur'];
  for (const term of medicalTerms) {
    if (prompt.toLowerCase().includes(term)) {
      score += 0.05;
    }
  }
  
  // Response quality factors (simplified)
  if (response.length > 100) score += 0.1;
  
  // Cap the score at 0.95
  return Math.min(0.95, score);
}

/**
 * Calculate a score for prompt-response pairs
 * This function is used by chat.js
 * @param {string} prompt - The user prompt
 * @param {string} response - The AI response 
 * @returns {number} Score between 0 and 1
 */
export function calculateScore(prompt, response) {
  return calculatePromptScore(prompt, response);
}
