import { db } from './database'

// Get overall card statistics
export async function getCardStats(deckId = null) {
  let cards
  if (deckId && deckId !== 'all') {
    cards = await db.cards.where('deckId').equals(deckId).toArray()
  } else {
    cards = await db.cards.toArray()
  }

  const now = new Date()
  const total = cards.length
  const learned = cards.filter(c => c.repetitions > 0).length
  const newCards = cards.filter(c => c.repetitions === 0).length
  const due = cards.filter(c => !c.nextReview || new Date(c.nextReview) <= now).length
  const mastered = cards.filter(c => c.repetitions >= 5 || c.easeFactor > 2.6).length

  return { total, learned, newCards, due, mastered }
}

// Get statistics for all decks
export async function getDeckStats() {
  const decks = await db.decks.toArray()
  const now = new Date()

  const deckStats = await Promise.all(decks.map(async (deck) => {
    const cards = await db.cards.where('deckId').equals(deck.id).toArray()
    const total = cards.length
    const learned = cards.filter(c => c.repetitions > 0).length
    const due = cards.filter(c => !c.nextReview || new Date(c.nextReview) <= now).length
    const mastered = cards.filter(c => c.repetitions >= 5 || c.easeFactor > 2.6).length

    return {
      id: deck.id,
      name: deck.name,
      total,
      learned,
      due,
      mastered,
      progress: total > 0 ? Math.round((learned / total) * 100) : 0
    }
  }))

  return deckStats
}

// Get learning progress breakdown
export async function getLearningProgress(deckId = null) {
  let cards
  if (deckId && deckId !== 'all') {
    cards = await db.cards.where('deckId').equals(deckId).toArray()
  } else {
    cards = await db.cards.toArray()
  }

  // Categorize cards by learning stage
  const stages = {
    new: 0,        // Never reviewed
    learning: 0,   // 1-2 repetitions
    reviewing: 0,  // 3-4 repetitions
    mastered: 0    // 5+ repetitions or high ease factor
  }

  cards.forEach(card => {
    if (card.repetitions === 0) {
      stages.new++
    } else if (card.repetitions <= 2) {
      stages.learning++
    } else if (card.repetitions <= 4) {
      stages.reviewing++
    } else {
      stages.mastered++
    }
  })

  return stages
}

// Get upcoming reviews forecast
export async function getUpcomingReviews(days = 7, deckId = null) {
  let cards
  if (deckId && deckId !== 'all') {
    cards = await db.cards.where('deckId').equals(deckId).toArray()
  } else {
    cards = await db.cards.toArray()
  }

  const now = new Date()
  const forecast = []

  for (let i = 0; i < days; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() + i)
    date.setHours(23, 59, 59, 999)

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    let count
    if (i === 0) {
      // Today: include all due cards (past due + due today)
      count = cards.filter(c => !c.nextReview || new Date(c.nextReview) <= date).length
    } else {
      // Future days: only cards due on that specific day
      count = cards.filter(c => {
        if (!c.nextReview) return false
        const reviewDate = new Date(c.nextReview)
        return reviewDate >= startOfDay && reviewDate <= date
      }).length
    }

    forecast.push({
      date: startOfDay.toISOString().split('T')[0],
      dayLabel: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' }),
      count
    })
  }

  return forecast
}

// Get average ease factor
export async function getAverageEaseFactor(deckId = null) {
  let cards
  if (deckId && deckId !== 'all') {
    cards = await db.cards.where('deckId').equals(deckId).toArray()
  } else {
    cards = await db.cards.toArray()
  }

  const reviewedCards = cards.filter(c => c.repetitions > 0)
  if (reviewedCards.length === 0) return 2.5

  const sum = reviewedCards.reduce((acc, c) => acc + c.easeFactor, 0)
  return Math.round((sum / reviewedCards.length) * 100) / 100
}

// Get study streak (days with reviews)
export async function getStudyStreak() {
  const cards = await db.cards.toArray()

  // Get unique dates when cards were last reviewed
  const reviewDates = new Set()
  cards.forEach(card => {
    if (card.lastReview) {
      const date = new Date(card.lastReview).toISOString().split('T')[0]
      reviewDates.add(date)
    }
  })

  if (reviewDates.size === 0) return 0

  // Count consecutive days from today
  const today = new Date()
  let streak = 0
  let checkDate = new Date(today)

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (reviewDates.has(dateStr)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (streak === 0) {
      // Check if we missed today but reviewed yesterday
      checkDate.setDate(checkDate.getDate() - 1)
      const yesterdayStr = checkDate.toISOString().split('T')[0]
      if (reviewDates.has(yesterdayStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    } else {
      break
    }
  }

  return streak
}
