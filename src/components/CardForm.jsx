import { useState, useEffect } from 'react'
import { pinyin } from 'pinyin-pro'
import { addCard, getAllDecks, createDeck } from '../db/database'

export function CardForm({ onCardAdded }) {
  const [chinese, setChinese] = useState('')
  const [pinyinText, setPinyinText] = useState('')
  const [english, setEnglish] = useState('')
  const [deckId, setDeckId] = useState('')
  const [decks, setDecks] = useState([])
  const [showNewDeck, setShowNewDeck] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')

  useEffect(() => {
    loadDecks()
  }, [])

  const loadDecks = async () => {
    const allDecks = await getAllDecks()
    setDecks(allDecks)
    if (allDecks.length > 0 && !deckId) {
      setDeckId(allDecks[0].id)
    }
  }

  const handleChineseChange = (value) => {
    setChinese(value)
    // Auto-generate pinyin
    if (value.trim()) {
      const generated = pinyin(value, { toneType: 'symbol' })
      setPinyinText(generated)
    } else {
      setPinyinText('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!chinese.trim() || !english.trim() || !deckId) return

    await addCard(deckId, chinese.trim(), pinyinText.trim(), english.trim())
    
    setChinese('')
    setPinyinText('')
    setEnglish('')
    
    if (onCardAdded) onCardAdded()
  }

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return
    const id = await createDeck(newDeckName.trim())
    setNewDeckName('')
    setShowNewDeck(false)
    await loadDecks()
    setDeckId(id)
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Add Card</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Chinese
          </label>
          <input
            type="text"
            value={chinese}
            onChange={(e) => handleChineseChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-xl chinese-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="中文"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pinyin (auto-generated)
          </label>
          <input
            type="text"
            value={pinyinText}
            onChange={(e) => setPinyinText(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="pīn yīn"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            English
          </label>
          <input
            type="text"
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="English translation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deck
          </label>
          <div className="flex gap-2">
            <select
              value={deckId}
              onChange={(e) => setDeckId(Number(e.target.value))}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {decks.map(deck => (
                <option key={deck.id} value={deck.id}>{deck.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewDeck(true)}
              className="px-4 py-3 rounded-lg bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200"
            >
              +
            </button>
          </div>
        </div>

        {showNewDeck && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="New deck name"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreateDeck}
              className="px-4 py-3 rounded-lg bg-blue-500 text-white"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowNewDeck(false)}
              className="px-4 py-3 rounded-lg bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={!chinese.trim() || !english.trim() || !deckId}
          className="w-full py-4 rounded-lg bg-blue-500 text-white font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-600"
        >
          Add Card
        </button>
      </form>
    </div>
  )
}
