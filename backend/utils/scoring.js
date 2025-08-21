/**
 * Calculate a score for the prompt-response pair based on:
 * 1. Response length (normalized between 0-0.4)
 * 2. Vocabulary diversity (unique words / total words) (0-0.4)
 * 3. Prompt relevance (how many prompt words appear in response) (0-0.2)
 * @param {string} prompt - The input prompt
 * @param {string} response - The generated response
 * @returns {number} - Score between 0 and 1
 */
export function calculateScore(prompt, response) {
  // 1. Response length score (normalized, max 0.4)
  const lengthScore = Math.min(response.length / 1000, 1) * 0.4;
  
  // 2. Vocabulary diversity
  const words = response.toLowerCase().split(/\W+/).filter(w => w.length > 0);
  const uniqueWords = new Set(words);
  const diversityScore = words.length > 0 
    ? (uniqueWords.size / words.length) * 0.4
    : 0;
  
  // 3. Prompt relevance
  const promptWords = new Set(
    prompt.toLowerCase().split(/\W+/).filter(w => w.length > 3)
  );
  let relevantWords = 0;
  
  for (const word of promptWords) {
    if (response.toLowerCase().includes(word)) {
      relevantWords++;
    }
  }
  
  const relevanceScore = promptWords.size > 0
    ? (relevantWords / promptWords.size) * 0.2
    : 0;
  
  // Calculate final score (0-1 range)
  const finalScore = (lengthScore + diversityScore + relevanceScore).toFixed(2);
  
  return parseFloat(finalScore);
}