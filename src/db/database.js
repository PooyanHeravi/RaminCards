import Dexie from 'dexie'
import beginnerCards from '../data/beginnerCards.json'

export const db = new Dexie('FlashcardDB')

db.version(1).stores({
  decks: '++id, name, createdAt',
  cards: '++id, deckId, chinese, traditional, pinyin, english, nextReview, lastReview',
  settings: 'key'
})

// Default settings
const defaultSettings = {
  theme: 'system',
  defaultDirection: 'cn-en',
  characterType: 'traditional'
}

// Seed beginner deck on first use
export async function seedBeginnerDeck() {
  const seeded = await db.settings.get('seeded')
  if (seeded) return false

  const deckId = await db.decks.add({
    name: 'HSK 1 Beginner',
    createdAt: new Date().toISOString()
  })

  const cards = beginnerCards.map(card => ({
    deckId,
    chinese: card.chinese,
    traditional: card.traditional,
    pinyin: card.pinyin,
    english: card.english,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReview: null,
    lastReview: null
  }))

  await db.cards.bulkAdd(cards)
  await db.settings.put({ key: 'seeded', value: true })
  return true
}

// Settings helpers
export async function getSetting(key) {
  const setting = await db.settings.get(key)
  return setting?.value ?? defaultSettings[key]
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}

// Deck operations
export async function createDeck(name) {
  return await db.decks.add({
    name,
    createdAt: new Date().toISOString()
  })
}

export async function getAllDecks() {
  const decks = await db.decks.toArray()
  for (const deck of decks) {
    deck.cardCount = await db.cards.where('deckId').equals(deck.id).count()
    deck.dueCount = await db.cards
      .where('deckId').equals(deck.id)
      .filter(card => !card.nextReview || new Date(card.nextReview) <= new Date())
      .count()
  }
  return decks
}

export async function deleteDeck(id) {
  await db.cards.where('deckId').equals(id).delete()
  await db.decks.delete(id)
}

export async function renameDeck(id, name) {
  await db.decks.update(id, { name })
}

// Card operations
export async function addCard(deckId, chinese, traditional, pinyin, english) {
  return await db.cards.add({
    deckId,
    chinese,
    traditional: traditional || chinese,
    pinyin,
    english,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReview: null,
    lastReview: null
  })
}

export async function addCards(cards) {
  return await db.cards.bulkAdd(cards.map(card => ({
    ...card,
    traditional: card.traditional || card.chinese,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReview: null,
    lastReview: null
  })))
}

export async function getCardsForDeck(deckId) {
  if (deckId === 'all') {
    return await db.cards.toArray()
  }
  return await db.cards.where('deckId').equals(deckId).toArray()
}

export async function getDueCards(deckId) {
  const now = new Date()
  let cards
  
  if (deckId === 'all') {
    cards = await db.cards.toArray()
  } else {
    cards = await db.cards.where('deckId').equals(deckId).toArray()
  }
  
  return cards.filter(card => !card.nextReview || new Date(card.nextReview) <= now)
}

export async function updateCard(id, updates) {
  await db.cards.update(id, updates)
}

export async function deleteCard(id) {
  await db.cards.delete(id)
}

export async function exportData() {
  const decks = await db.decks.toArray()
  const cards = await db.cards.toArray()
  const settings = await db.settings.toArray()
  return { decks, cards, settings, exportedAt: new Date().toISOString() }
}

export async function importData(data) {
  await db.transaction('rw', [db.decks, db.cards, db.settings], async () => {
    await db.decks.clear()
    await db.cards.clear()
    await db.settings.clear()
    
    if (data.decks?.length) await db.decks.bulkAdd(data.decks)
    if (data.cards?.length) await db.cards.bulkAdd(data.cards)
    if (data.settings?.length) await db.settings.bulkAdd(data.settings)
  })
}
