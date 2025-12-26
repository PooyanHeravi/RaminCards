import { useState, useEffect } from 'react'
import { Navigation } from './components/Navigation'
import { StudySession } from './components/StudySession'
import { CardForm } from './components/CardForm'
import { BulkImport } from './components/BulkImport'
import { DeckList } from './components/DeckList'
import { Stats } from './components/Stats'
import { Settings } from './components/Settings'
import { useTheme } from './hooks/useTheme'
import { seedBeginnerDeck } from './db/database'

function App() {
  const [activeTab, setActiveTab] = useState('study')
  const [showBulkImport, setShowBulkImport] = useState(false)
  useTheme()

  useEffect(() => {
    seedBeginnerDeck()
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case 'study':
        return <StudySession />
      case 'add':
        if (showBulkImport) {
          return (
            <div>
              <div className="p-4 flex justify-between items-center">
                <button 
                  onClick={() => setShowBulkImport(false)}
                  className="text-blue-500"
                >
                  Back to Quick Add
                </button>
              </div>
              <BulkImport onImported={() => setShowBulkImport(false)} />
            </div>
          )
        }
        return (
          <div>
            <CardForm />
            <div className="px-4 pb-20">
              <button
                onClick={() => setShowBulkImport(true)}
                className="w-full py-3 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400"
              >
                Bulk Import
              </button>
            </div>
          </div>
        )
      case 'decks':
        return <DeckList />
      case 'stats':
        return <Stats />
      case 'settings':
        return <Settings />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <header className="bg-blue-500 text-white py-3 px-4 text-center">
        <h1 className="text-lg font-bold tracking-wide">RaminCards</h1>
      </header>
      <main className="max-w-lg mx-auto">
        {renderContent()}
      </main>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
