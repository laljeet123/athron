export function generateFeedback(analysisResult) {
  if (!analysisResult) {
    return { score: 0, feedback: ["Waiting for pose analysis..."], summary: "No analysis available." };
  }

  const corrections = analysisResult.rules
    .filter((rule) => !rule.passed)
    .map((rule) => `❌ ${rule.message}`);

  const positives = analysisResult.rules
    .filter((rule) => rule.passed)
    .map((rule) => `✅ ${rule.message}`);

  const feedback = [...positives, ...corrections];

  return {
    score: analysisResult.score,
    feedback: feedback.length ? feedback : ["Performing well — keep going!"],
    summary: analysisResult.passed ? "Good form detected." : "Adjust your form in the highlighted areas.",
  };
}
