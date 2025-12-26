import { useState, useEffect, useRef } from 'react'
import { getDueCards, getAllDecks, updateCard, getSetting, getCardsForDeck } from '../db/database'
import { calculateNextReview, QUALITY } from '../utils/spacedRepetition'
import { Volume2, ChevronDown, ChevronUp } from 'lucide-react'
import sentenceExamples from '../data/sentenceExamples.json'

export function StudySession() {
  const [decks, setDecks] = useState([])
  const [selectedDeck, setSelectedDeck] = useState('all')
  const [direction, setDirection] = useState('cn-en')
  const [charType, setCharType] = useState('traditional')
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [completed, setCompleted] = useState(0)

  // Mixed mode: store direction per card
  const [cardDirections, setCardDirections] = useState([])

  // Related words
  const [allCards, setAllCards] = useState([])
  const [showExamples, setShowExamples] = useState(false)

  // TTS voices
  const [chineseVoices, setChineseVoices] = useState([])

  // Swipe gesture state
  const touchStart = useRef({ x: 0, y: 0 })
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 })
  const [swipeHint, setSwipeHint] = useState(null)

  useEffect(() => {
    loadDecks()
    getSetting('characterType').then(setCharType)
    // Load all cards for related words feature
    getCardsForDeck('all').then(setAllCards)
  }, [])

  const loadDecks = async () => {
    const allDecks = await getAllDecks()
    setDecks(allDecks)
  }

  // Load TTS voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || []
      const zhVoices = voices.filter(v => v.lang.startsWith('zh'))
      setChineseVoices(zhVoices)
    }

    loadVoices()
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // Text-to-Speech for Chinese
  const speakChinese = (text) => {
    if (!text || !window.speechSynthesis || chineseVoices.length === 0) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    // Select voice based on character type
    const preferredLangs = charType === 'traditional'
      ? ['zh-TW', 'zh-HK', 'zh-CN']  // Prefer Taiwan/HK for traditional
      : ['zh-CN', 'zh-TW']           // Prefer Mainland for simplified

    // Find best matching voice
    let voice = null
    for (const lang of preferredLangs) {
      voice = chineseVoices.find(v => v.lang === lang)
      if (voice) break
    }

    // Fallback to any Chinese voice
    if (!voice) voice = chineseVoices[0]

    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    }

    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }

  const startSession = async () => {
    const dueCards = await getDueCards(selectedDeck === 'all' ? 'all' : Number(selectedDeck))
    if (dueCards.length === 0) {
      alert('No cards due for review!')
      return
    }
    const shuffled = [...dueCards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    setCompleted(0)
    setShowExamples(false)

    // For mixed mode, assign random direction to each card
    if (direction === 'mixed') {
      const directions = shuffled.map(() => Math.random() > 0.5 ? 'cn-en' : 'en-cn')
      setCardDirections(directions)
    }

    setSessionStarted(true)
  }

  const handleFlip = () => setIsFlipped(!isFlipped)

  const handleRate = async (quality) => {
    const card = cards[currentIndex]
    const updates = calculateNextReview(card, quality)
    await updateCard(card.id, updates)
    setCompleted(prev => prev + 1)
    setShowExamples(false)

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
    } else {
      setSessionStarted(false)
    }
  }

  // Touch handlers for swipe gestures
  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
    setSwipeOffset({ x: 0, y: 0 })
    setSwipeHint(null)
  }

  const handleTouchMove = (e) => {
    if (!isFlipped) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y

    const maxOffset = 60
    setSwipeOffset({
      x: Math.max(-maxOffset, Math.min(maxOffset, deltaX * 0.3)),
      y: Math.max(-maxOffset, Math.min(maxOffset, deltaY * 0.3))
    })

    const threshold = 40
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX > threshold || absY > threshold) {
      if (absX > absY) {
        setSwipeHint(deltaX < 0 ? 'again' : 'good')
      } else {
        setSwipeHint(deltaY < 0 ? 'easy' : 'hard')
      }
    } else {
      setSwipeHint(null)
    }
  }

  const handleTouchEnd = (e) => {
    if (!isFlipped) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y

    const swipeThreshold = 80
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    setSwipeOffset({ x: 0, y: 0 })
    setSwipeHint(null)

    if (absX > swipeThreshold || absY > swipeThreshold) {
      if (absX > absY) {
        if (deltaX < 0) {
          handleRate(QUALITY.AGAIN)
        } else {
          handleRate(QUALITY.GOOD)
        }
      } else {
        if (deltaY < 0) {
          handleRate(QUALITY.EASY)
        } else {
          handleRate(QUALITY.HARD)
        }
      }
    }
  }

  const currentCard = cards[currentIndex]

  // Get current direction (for mixed mode)
  const getCurrentDirection = () => {
    if (direction === 'mixed' && cardDirections[currentIndex]) {
      return cardDirections[currentIndex]
    }
    return direction
  }

  const getChineseText = (card) => {
    if (!card) return ''
    return charType === 'traditional' ? (card.traditional || card.chinese) : card.chinese
  }

  // Get related words (cards sharing characters)
  const getRelatedWords = (card) => {
    if (!card || !allCards.length) return []

    const chars = [...getChineseText(card)]
    const related = allCards.filter(c => {
      if (c.id === card.id) return false
      const otherChars = [...getChineseText(c)]
      return chars.some(char => otherChars.includes(char))
    }).slice(0, 4)

    return related
  }

  // Get sentence examples for current card
  const getSentenceExamples = (card) => {
    if (!card) return []

    const chinese = card.chinese
    // Try exact match first, then individual characters
    if (sentenceExamples[chinese]) {
      return sentenceExamples[chinese]
    }

    // Try first character
    const firstChar = chinese[0]
    if (sentenceExamples[firstChar]) {
      return sentenceExamples[firstChar].slice(0, 1)
    }

    return []
  }

  if (!sessionStarted) {
    return (
      <div className="p-4 pb-20">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Study</h1>

        {completed > 0 && (
          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded-lg mb-6 text-center">
            Session complete! Reviewed {completed} cards.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Deck
            </label>
            <select
              value={selectedDeck}
              onChange={(e) => setSelectedDeck(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Cards</option>
              {decks.map(deck => (
                <option key={deck.id} value={deck.id}>
                  {deck.name} ({deck.dueCount} due)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Study Direction
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setDirection('cn-en')}
                className={direction === 'cn-en'
                  ? 'py-3 rounded-lg font-medium bg-blue-500 text-white text-sm'
                  : 'py-3 rounded-lg font-medium bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-sm'}
              >
                CN → EN
              </button>
              <button
                onClick={() => setDirection('en-cn')}
                className={direction === 'en-cn'
                  ? 'py-3 rounded-lg font-medium bg-blue-500 text-white text-sm'
                  : 'py-3 rounded-lg font-medium bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-sm'}
              >
                EN → CN
              </button>
              <button
                onClick={() => setDirection('mixed')}
                className={direction === 'mixed'
                  ? 'py-3 rounded-lg font-medium bg-purple-500 text-white text-sm'
                  : 'py-3 rounded-lg font-medium bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-sm'}
              >
                Mixed
              </button>
            </div>
          </div>

          <button
            onClick={startSession}
            className="w-full py-4 rounded-lg bg-blue-500 text-white font-medium text-lg active:bg-blue-600"
          >
            Start Study Session
          </button>
        </div>
      </div>
    )
  }

  const currentDir = getCurrentDirection()
  const relatedWords = getRelatedWords(currentCard)
  const examples = getSentenceExamples(currentCard)

  const getFrontContent = () => {
    if (!currentCard) return null
    if (currentDir === 'cn-en') {
      return (
        <>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-4xl chinese-text">{getChineseText(currentCard)}</div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                speakChinese(getChineseText(currentCard))
              }}
              disabled={chineseVoices.length === 0}
              className={`p-2 rounded-full ${chineseVoices.length === 0 ? 'bg-gray-200 dark:bg-gray-700 text-gray-400' : 'bg-blue-100 dark:bg-blue-900 text-blue-500 active:bg-blue-200'}`}
            >
              <Volume2 size={20} />
            </button>
          </div>
          <div className="text-xl text-gray-500 dark:text-gray-400">{currentCard.pinyin}</div>
        </>
      )
    }
    return <div className="text-3xl">{currentCard.english}</div>
  }

  const getBackContent = () => {
    if (!currentCard) return null
    if (currentDir === 'cn-en') {
      return (
        <div className="w-full">
          <div className="text-3xl mb-4">{currentCard.english}</div>

          {/* Sentence Examples */}
          {examples.length > 0 && (
            <div className="mt-4 text-left">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowExamples(!showExamples)
                }}
                className="flex items-center gap-1 text-sm text-blue-500 mb-2"
              >
                {showExamples ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Example sentences
              </button>
              {showExamples && (
                <div className="space-y-2 text-sm">
                  {examples.map((ex, i) => (
                    <div key={i} className="bg-gray-100 dark:bg-slate-700 rounded-lg p-2">
                      <div className="chinese-text flex items-center gap-2">
                        {ex.cn}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            speakChinese(ex.cn)
                          }}
                          disabled={chineseVoices.length === 0}
                          className={`p-1 ${chineseVoices.length === 0 ? 'text-gray-400' : 'text-blue-500'}`}
                        >
                          <Volume2 size={14} />
                        </button>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{ex.pinyin}</div>
                      <div className="text-gray-600 dark:text-gray-300">{ex.en}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Related Words */}
          {relatedWords.length > 0 && (
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Related: </span>
              {relatedWords.map((w, i) => (
                <span key={w.id} className="chinese-text">
                  {getChineseText(w)}
                  {i < relatedWords.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )
    }
    return (
      <div className="w-full">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="text-4xl chinese-text">{getChineseText(currentCard)}</div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              speakChinese(getChineseText(currentCard))
            }}
            disabled={chineseVoices.length === 0}
            className={`p-2 rounded-full ${chineseVoices.length === 0 ? 'bg-gray-200 dark:bg-gray-700 text-gray-400' : 'bg-blue-100 dark:bg-blue-900 text-blue-500 active:bg-blue-200'}`}
          >
            <Volume2 size={20} />
          </button>
        </div>
        <div className="text-xl text-gray-500 dark:text-gray-400 mb-4">{currentCard.pinyin}</div>

        {/* Sentence Examples */}
        {examples.length > 0 && (
          <div className="mt-4 text-left">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowExamples(!showExamples)
              }}
              className="flex items-center gap-1 text-sm text-blue-500 mb-2"
            >
              {showExamples ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Example sentences
            </button>
            {showExamples && (
              <div className="space-y-2 text-sm">
                {examples.map((ex, i) => (
                  <div key={i} className="bg-gray-100 dark:bg-slate-700 rounded-lg p-2">
                    <div className="chinese-text flex items-center gap-2">
                      {ex.cn}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          speakChinese(ex.cn)
                        }}
                        disabled={chineseVoices.length === 0}
                        className={`p-1 ${chineseVoices.length === 0 ? 'text-gray-400' : 'text-blue-500'}`}
                      >
                        <Volume2 size={14} />
                      </button>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">{ex.pinyin}</div>
                    <div className="text-gray-600 dark:text-gray-300">{ex.en}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Related Words */}
        {relatedWords.length > 0 && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Related: </span>
            {relatedWords.map((w, i) => (
              <span key={w.id} className="chinese-text">
                {getChineseText(w)}
                {i < relatedWords.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  const getSwipeHintStyle = () => {
    if (!swipeHint) return {}
    const colors = {
      again: 'rgba(239, 68, 68, 0.2)',
      hard: 'rgba(249, 115, 22, 0.2)',
      good: 'rgba(34, 197, 94, 0.2)',
      easy: 'rgba(59, 130, 246, 0.2)'
    }
    return { backgroundColor: colors[swipeHint] }
  }

  return (
    <div className="p-4 pb-20 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setSessionStarted(false)} className="text-blue-500">
          End Session
        </button>
        <div className="flex items-center gap-2">
          {direction === 'mixed' && (
            <span className="text-xs px-2 py-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
              {currentDir === 'cn-en' ? 'CN→EN' : 'EN→CN'}
            </span>
          )}
          <span className="text-gray-600 dark:text-gray-400">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full mb-6">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: (currentIndex / cards.length * 100) + '%' }}
        />
      </div>

      <div
        className={'flip-card flex-1 min-h-[400px] cursor-pointer' + (isFlipped ? ' flipped' : '')}
        onClick={handleFlip}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translate(${swipeOffset.x}px, ${swipeOffset.y}px)`,
          transition: swipeOffset.x === 0 && swipeOffset.y === 0 ? 'transform 0.2s' : 'none'
        }}
      >
        <div className="flip-card-inner">
          <div
            className="flip-card-front bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center p-6 transition-colors"
            style={getSwipeHintStyle()}
          >
            <div className="text-center dark:text-white">
              {getFrontContent()}
              <div className="mt-8 text-gray-400 text-sm">Tap to reveal</div>
            </div>
          </div>
          <div
            className="flip-card-back bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center p-6 transition-colors overflow-y-auto"
            style={getSwipeHintStyle()}
          >
            <div className="text-center dark:text-white w-full">
              {getBackContent()}
              {isFlipped && (
                <div className="mt-4 text-gray-400 text-xs">
                  Swipe: ← Again | → Good | ↑ Easy | ↓ Hard
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="grid grid-cols-4 gap-2 mt-6">
          <button
            onClick={() => handleRate(QUALITY.AGAIN)}
            className={'py-4 rounded-lg font-medium transition-transform ' + (swipeHint === 'again' ? 'bg-red-600 text-white scale-105' : 'bg-red-500 text-white')}
          >
            Again
          </button>
          <button
            onClick={() => handleRate(QUALITY.HARD)}
            className={'py-4 rounded-lg font-medium transition-transform ' + (swipeHint === 'hard' ? 'bg-orange-600 text-white scale-105' : 'bg-orange-500 text-white')}
          >
            Hard
          </button>
          <button
            onClick={() => handleRate(QUALITY.GOOD)}
            className={'py-4 rounded-lg font-medium transition-transform ' + (swipeHint === 'good' ? 'bg-green-600 text-white scale-105' : 'bg-green-500 text-white')}
          >
            Good
          </button>
          <button
            onClick={() => handleRate(QUALITY.EASY)}
            className={'py-4 rounded-lg font-medium transition-transform ' + (swipeHint === 'easy' ? 'bg-blue-600 text-white scale-105' : 'bg-blue-500 text-white')}
          >
            Easy
          </button>
        </div>
      )}
    </div>
  )
}
