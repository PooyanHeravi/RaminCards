import { BookOpen, PlusCircle, Layers, BarChart3, Settings } from 'lucide-react'

const tabs = [
  { id: 'study', label: 'Study', icon: BookOpen },
  { id: 'add', label: 'Add', icon: PlusCircle },
  { id: 'decks', label: 'Decks', icon: Layers },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Navigation({ activeTab, onTabChange }) {
  const getClass = (id) => {
    const base = 'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors'
    return activeTab === id
      ? base + ' text-blue-500'
      : base + ' text-gray-500 dark:text-gray-400'
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 safe-bottom">
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={getClass(id)}
          >
            <Icon size={24} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
