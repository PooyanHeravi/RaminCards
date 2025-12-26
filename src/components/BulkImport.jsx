import { useState, useEffect } from 'react'
import { pinyin } from 'pinyin-pro'
import { addCards, getAllDecks, createDeck } from '../db/database'

export function BulkImport({ onImported }) {
  const [text, setText] = useState('')
  const [decks, setDecks] = useState([])
  const [deckId, setDeckId] = useState('')
  const [preview, setPreview] = useState([])
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

  const parseText = (input) => {
    const lines = input.trim().split('\n').filter(line => line.trim())
    return lines.map(line => {
      // Try different separators: |, tab, comma
      let parts
      if (line.includes('|')) {
        parts = line.split('|').map(p => p.trim())
      } else if (line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim())
      } else if (line.includes(',')) {
        parts = line.split(',').map(p => p.trim())
      } else {
        return null
      }

      if (parts.length === 2) {
        // chinese | english - auto-generate pinyin
        const [chinese, english] = parts
        return {
          chinese,
          pinyin: pinyin(chinese, { toneType: 'symbol' }),
          english
        }
      } else if (parts.length >= 3) {
        // chinese | pinyin | english
        const [chinese, pinyinText, english] = parts
        return { chinese, pinyin: pinyinText, english }
      }
      return null
    }).filter(Boolean)
  }

  const handleTextChange = (value) => {
    setText(value)
    setPreview(parseText(value))
  }

  const handleImport = async () => {
    if (preview.length === 0 || !deckId) return
    
    const cards = preview.map(card => ({
      ...card,
      deckId: Number(deckId)
    }))
    
    await addCards(cards)
    setText('')
    setPreview([])
    if (onImported) onImported()
    alert('Imported ' + cards.length + ' cards!')
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
      <h1 className="text-2xl font-bold mb-2 dark:text-white">Bulk Import</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
        Paste word pairs separated by | , or tab. One pair per line.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deck
          </label>
          <div className="flex gap-2">
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
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
            <button onClick={handleCreateDeck} className="px-4 py-3 rounded-lg bg-blue-500 text-white">Create</button>
            <button onClick={() => setShowNewDeck(false)} className="px-4 py-3 rounded-lg bg-gray-200 dark:bg-slate-600">Cancel</button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Word Pairs
          </label>
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white h-40"
            placeholder="你好 | hello&#10;谢谢 | thank you&#10;再见 | goodbye"
          />
        </div>

        {preview.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview ({preview.length} cards)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {preview.slice(0, 10).map((card, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-3 text-sm">
                  <div className="chinese-text dark:text-white">{card.chinese}</div>
                  <div className="text-gray-500 dark:text-gray-400">{card.pinyin}</div>
                  <div className="text-gray-700 dark:text-gray-300">{card.english}</div>
                </div>
              ))}
              {preview.length > 10 && (
                <div className="text-gray-500 text-center">
                  ...and {preview.length - 10} more
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={preview.length === 0 || !deckId}
          className="w-full py-4 rounded-lg bg-blue-500 text-white font-medium text-lg disabled:opacity-50"
        >
          Import {preview.length} Cards
        </button>
      </div>
    </div>
  )
}
