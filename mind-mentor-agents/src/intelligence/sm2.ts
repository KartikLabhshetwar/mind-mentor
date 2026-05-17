export interface SM2Input {
  repetitions: number;
  easiness: number;
  interval: number;
  quality: number; // 0-5
}

export interface SM2Result {
  repetitions: number;
  easiness: number;
  interval: number;
  nextReview: Date;
}

export function calculateSM2(input: SM2Input): SM2Result {
  const { repetitions, easiness, interval, quality } = input;

  let newEasiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEasiness = Math.max(1.3, newEasiness);

  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = repetitions + 1;
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEasiness);
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    repetitions: newRepetitions,
    easiness: Math.round(newEasiness * 100) / 100,
    interval: newInterval,
    nextReview,
  };
}

export function calculateMasteryScore(
  easiness: number,
  reviewCount: number,
  daysSinceLastReview: number
): number {
  const easinessNormalized = (easiness / 2.5) * 100;
  const reviewNormalized = (Math.min(reviewCount, 10) / 10) * 100;
  const recencyScore = 100 * Math.exp(-0.1 * daysSinceLastReview);

  return Math.round(
    easinessNormalized * 0.4 +
    reviewNormalized * 0.3 +
    recencyScore * 0.3
  );
}
