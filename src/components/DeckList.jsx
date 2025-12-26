import { useState, useEffect } from 'react'
import { getAllDecks, deleteDeck, renameDeck, createDeck, getCardsForDeck, deleteCard, updateCard } from '../db/database'
import { Trash2, Edit2, ChevronRight, Plus, Search, X, Check } from 'lucide-react'
import { pinyin } from 'pinyin-pro'
import { ConfirmDialog } from './ConfirmDialog'

export function DeckList() {
  const [decks, setDecks] = useState([])
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [cards, setCards] = useState([])
  const [editingDeck, setEditingDeck] = useState(null)
  const [editName, setEditName] = useState('')
  const [showNewDeck, setShowNewDeck] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Edit card state
  const [editingCard, setEditingCard] = useState(null)
  const [editCardData, setEditCardData] = useState({ chinese: '', pinyin: '', english: '' })

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  useEffect(() => {
    loadDecks()
  }, [])

  const loadDecks = async () => {
    const allDecks = await getAllDecks()
    setDecks(allDecks)
  }

  const showConfirm = (title, message, onConfirm) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm })
  }

  const closeConfirm = () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false })
  }

  const handleDeleteDeck = async (id, e) => {
    e.stopPropagation()
    const deck = decks.find(d => d.id === id)
    showConfirm(
      'Delete Deck',
      `Delete "${deck?.name}" and all ${deck?.cardCount || 0} cards? This cannot be undone.`,
      async () => {
        await deleteDeck(id)
        await loadDecks()
        if (selectedDeck === id) {
          setSelectedDeck(null)
          setCards([])
        }
        closeConfirm()
      }
    )
  }

  const handleEditDeck = async (deck, e) => {
    e.stopPropagation()
    setEditingDeck(deck.id)
    setEditName(deck.name)
  }

  const handleSaveEdit = async () => {
    if (editName.trim() && editingDeck) {
      await renameDeck(editingDeck, editName.trim())
      setEditingDeck(null)
      await loadDecks()
    }
  }

  const handleSelectDeck = async (deckId) => {
    setSelectedDeck(deckId)
    setSearchQuery('')
    const deckCards = await getCardsForDeck(deckId)
    setCards(deckCards)
  }

  const handleDeleteCard = async (cardId) => {
    const card = cards.find(c => c.id === cardId)
    showConfirm(
      'Delete Card',
      `Delete "${card?.chinese}" - "${card?.english}"?`,
      async () => {
        await deleteCard(cardId)
        const deckCards = await getCardsForDeck(selectedDeck)
        setCards(deckCards)
        await loadDecks()
        closeConfirm()
      }
    )
  }

  const handleEditCard = (card) => {
    setEditingCard(card.id)
    setEditCardData({
      chinese: card.chinese,
      traditional: card.traditional || card.chinese,
      pinyin: card.pinyin,
      english: card.english
    })
  }

  const handleCancelEditCard = () => {
    setEditingCard(null)
    setEditCardData({ chinese: '', pinyin: '', english: '' })
  }

  const handleSaveCard = async () => {
    if (!editCardData.chinese.trim() || !editCardData.english.trim()) return

    await updateCard(editingCard, {
      chinese: editCardData.chinese.trim(),
      traditional: editCardData.traditional?.trim() || editCardData.chinese.trim(),
      pinyin: editCardData.pinyin.trim(),
      english: editCardData.english.trim()
    })

    setEditingCard(null)
    const deckCards = await getCardsForDeck(selectedDeck)
    setCards(deckCards)
  }

  const handleChineseChange = (value) => {
    const newPinyin = value ? pinyin(value, { toneType: 'symbol' }) : ''
    setEditCardData({
      ...editCardData,
      chinese: value,
      traditional: value,
      pinyin: newPinyin
    })
  }

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return
    await createDeck(newDeckName.trim())
    setNewDeckName('')
    setShowNewDeck(false)
    await loadDecks()
  }

  // Filter cards based on search query
  const filteredCards = searchQuery.trim()
    ? cards.filter(card => {
        const query = searchQuery.toLowerCase()
        return (
          card.chinese?.toLowerCase().includes(query) ||
          card.traditional?.toLowerCase().includes(query) ||
          card.pinyin?.toLowerCase().includes(query) ||
          card.english?.toLowerCase().includes(query)
        )
      })
    : cards

  if (selectedDeck) {
    const deck = decks.find(d => d.id === selectedDeck)
    return (
      <div className="p-4 pb-20">
        <button
          onClick={() => { setSelectedDeck(null); setCards([]); setSearchQuery('') }}
          className="text-blue-500 mb-4 flex items-center gap-1"
        >
          ← Back to Decks
        </button>
        <h1 className="text-2xl font-bold mb-2 dark:text-white">{deck?.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{cards.length} cards</p>

        {/* Search input */}
        {cards.length > 0 && (
          <div className="relative mb-4">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {cards.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No cards in this deck yet
          </p>
        ) : filteredCards.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No cards match "{searchQuery}"
          </p>
        ) : (
          <div className="space-y-2">
            {filteredCards.map(card => (
              <div
                key={card.id}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm"
              >
                {editingCard === card.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editCardData.chinese}
                      onChange={(e) => handleChineseChange(e.target.value)}
                      placeholder="Chinese"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white chinese-text"
                    />
                    <input
                      type="text"
                      value={editCardData.pinyin}
                      onChange={(e) => setEditCardData({ ...editCardData, pinyin: e.target.value })}
                      placeholder="Pinyin"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={editCardData.english}
                      onChange={(e) => setEditCardData({ ...editCardData, english: e.target.value })}
                      placeholder="English"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleCancelEditCard}
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveCard}
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white flex items-center gap-1"
                      >
                        <Check size={16} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg chinese-text dark:text-white">{card.chinese}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{card.pinyin}</div>
                      <div className="text-gray-700 dark:text-gray-300">{card.english}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditCard(card)}
                        className="p-2 text-gray-400 hover:text-blue-500"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={closeConfirm}
        />
      </div>
    )
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Decks</h1>

      {showNewDeck ? (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            placeholder="Deck name"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            autoFocus
          />
          <button
            onClick={handleCreateDeck}
            className="px-4 py-3 rounded-lg bg-blue-500 text-white"
          >
            Create
          </button>
          <button
            onClick={() => setShowNewDeck(false)}
            className="px-4 py-3 rounded-lg bg-gray-200 dark:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewDeck(true)}
          className="w-full py-3 mb-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2"
        >
          <Plus size={20} /> New Deck
        </button>
      )}

      {decks.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No decks yet. Create your first deck!
        </p>
      ) : (
        <div className="space-y-2">
          {decks.map(deck => (
            <div
              key={deck.id}
              onClick={() => handleSelectDeck(deck.id)}
              className="bg-white dark:bg-slate-800 rounded-lg p-4 flex justify-between items-center shadow-sm cursor-pointer active:bg-gray-50 dark:active:bg-slate-700"
            >
              {editingDeck === deck.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  className="flex-1 px-2 py-1 rounded border dark:bg-slate-700 dark:text-white"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div>
                  <div className="font-medium dark:text-white">{deck.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {deck.cardCount} cards • {deck.dueCount} due
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleEditDeck(deck, e)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={(e) => handleDeleteDeck(deck.id, e)}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  )
}
