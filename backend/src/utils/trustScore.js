function calculateTrustScore(avgRating, totalReviews) {
  if (totalReviews === 0) return 0;

  let score = avgRating;

  if (totalReviews < 3) score -= 0.5;   // low confidence penalty
  if (totalReviews > 10) score += 0.3;  // consistency bonus

  return Math.min(Math.max(score, 1), 5).toFixed(1);
}

module.exports = calculateTrustScore;