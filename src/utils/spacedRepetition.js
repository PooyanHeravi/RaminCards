/**
 * SM-2 Spaced Repetition Algorithm
 * 
 * Quality ratings:
 * 0 - Complete blackout, no recall
 * 1 - Incorrect, but remembered upon seeing answer
 * 2 - Incorrect, but answer seemed easy to recall
 * 3 - Correct with serious difficulty
 * 4 - Correct with some hesitation
 * 5 - Perfect recall
 * 
 * For simplicity, we use 4 buttons:
 * Again (0), Hard (2), Good (4), Easy (5)
 */

export const QUALITY = {
  AGAIN: 0,
  HARD: 2,
  GOOD: 4,
  EASY: 5
}

export function calculateNextReview(card, quality) {
  let { interval, easeFactor, repetitions } = card
  
  // Ensure valid initial values
  interval = interval || 0
  easeFactor = easeFactor || 2.5
  repetitions = repetitions || 0
  
  if (quality < 3) {
    // Failed - reset to beginning
    repetitions = 0
    interval = 0
  } else {
    // Passed - calculate new interval
    if (repetitions === 0) {
      interval = 1 // 1 day
    } else if (repetitions === 1) {
      interval = 6 // 6 days
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  }
  
  // Update ease factor (minimum 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )
  
  // Calculate next review date
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)
  
  return {
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100,
    repetitions,
    nextReview: nextReview.toISOString(),
    lastReview: new Date().toISOString()
  }
}

export function formatNextReview(nextReview) {
  if (!nextReview) return 'New'
  
  const next = new Date(nextReview)
  const now = new Date()
  const diffMs = next - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 0) return 'Due'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return diffDays + ' days'
  if (diffDays < 30) return Math.round(diffDays / 7) + ' weeks'
  return Math.round(diffDays / 30) + ' months'
}
