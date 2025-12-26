import { useState, useEffect } from 'react'
import { getCardStats, getDeckStats, getLearningProgress, getUpcomingReviews, getStudyStreak } from '../db/statistics'
import { BookOpen, Target, Clock, Trophy, Flame } from 'lucide-react'

export function Stats() {
  const [stats, setStats] = useState(null)
  const [deckStats, setDeckStats] = useState([])
  const [progress, setProgress] = useState(null)
  const [forecast, setForecast] = useState([])
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [cardStats, decks, learningProgress, upcoming, studyStreak] = await Promise.all([
        getCardStats(),
        getDeckStats(),
        getLearningProgress(),
        getUpcomingReviews(7),
        getStudyStreak()
      ])
      setStats(cardStats)
      setDeckStats(decks)
      setProgress(learningProgress)
      setForecast(upcoming)
      setStreak(studyStreak)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Statistics</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>
    )
  }

  const progressTotal = progress ? progress.new + progress.learning + progress.reviewing + progress.mastered : 0
  const getProgressPercent = (value) => progressTotal > 0 ? (value / progressTotal * 100) : 0

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Statistics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <BookOpen size={18} />
            <span className="text-sm font-medium">Total Cards</span>
          </div>
          <div className="text-2xl font-bold dark:text-white">{stats?.total || 0}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-green-500 mb-1">
            <Target size={18} />
            <span className="text-sm font-medium">Learned</span>
          </div>
          <div className="text-2xl font-bold dark:text-white">{stats?.learned || 0}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-orange-500 mb-1">
            <Clock size={18} />
            <span className="text-sm font-medium">Due Today</span>
          </div>
          <div className="text-2xl font-bold dark:text-white">{stats?.due || 0}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-purple-500 mb-1">
            <Trophy size={18} />
            <span className="text-sm font-medium">Mastered</span>
          </div>
          <div className="text-2xl font-bold dark:text-white">{stats?.mastered || 0}</div>
        </div>
      </div>

      {/* Study Streak */}
      {streak > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center gap-2">
            <Flame size={24} />
            <div>
              <div className="text-2xl font-bold">{streak} day streak!</div>
              <div className="text-sm opacity-90">Keep it up!</div>
            </div>
          </div>
        </div>
      )}

      {/* Learning Progress */}
      {progress && progressTotal > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm mb-6">
          <h2 className="font-semibold dark:text-white mb-3">Learning Progress</h2>
          <div className="h-4 rounded-full overflow-hidden flex bg-gray-200 dark:bg-slate-700">
            <div
              className="bg-gray-400 transition-all"
              style={{ width: getProgressPercent(progress.new) + '%' }}
              title={`New: ${progress.new}`}
            />
            <div
              className="bg-yellow-500 transition-all"
              style={{ width: getProgressPercent(progress.learning) + '%' }}
              title={`Learning: ${progress.learning}`}
            />
            <div
              className="bg-blue-500 transition-all"
              style={{ width: getProgressPercent(progress.reviewing) + '%' }}
              title={`Reviewing: ${progress.reviewing}`}
            />
            <div
              className="bg-green-500 transition-all"
              style={{ width: getProgressPercent(progress.mastered) + '%' }}
              title={`Mastered: ${progress.mastered}`}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400" /> New ({progress.new})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" /> Learning ({progress.learning})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Reviewing ({progress.reviewing})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Mastered ({progress.mastered})
            </span>
          </div>
        </div>
      )}

      {/* Upcoming Reviews */}
      {forecast.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm mb-6">
          <h2 className="font-semibold dark:text-white mb-3">Upcoming Reviews</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {forecast.map((day, i) => (
              <div
                key={day.date}
                className={'flex-shrink-0 w-16 text-center rounded-lg p-2 ' +
                  (i === 0 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-slate-700')}
              >
                <div className={'text-xs font-medium ' + (i === 0 ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400')}>
                  {day.dayLabel}
                </div>
                <div className={'text-lg font-bold ' + (i === 0 ? 'text-blue-600 dark:text-blue-300' : 'dark:text-white')}>
                  {day.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deck Breakdown */}
      {deckStats.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold dark:text-white mb-3">Deck Progress</h2>
          <div className="space-y-3">
            {deckStats.map(deck => (
              <div key={deck.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="dark:text-white">{deck.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {deck.learned}/{deck.total} ({deck.progress}%)
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: deck.progress + '%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
