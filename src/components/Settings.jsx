import { useState, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { exportData, importData, getSetting, setSetting } from '../db/database'
import { Sun, Moon, Monitor, Download, Upload } from 'lucide-react'

export function Settings() {
  const { theme, setTheme } = useTheme()
  const [importing, setImporting] = useState(false)
  const [charType, setCharType] = useState('traditional')

  useEffect(() => {
    getSetting('characterType').then(setCharType)
  }, [])

  const handleCharTypeChange = async (type) => {
    setCharType(type)
    await setSetting('characterType', type)
  }

  const handleExport = async () => {
    const data = await exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flashcards-backup-' + new Date().toISOString().split('T')[0] + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importData(data)
      alert('Import successful!')
      window.location.reload()
    } catch (err) {
      alert('Import failed: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Settings</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Chinese Characters
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCharTypeChange('traditional')}
              className={
                'py-3 px-4 rounded-lg flex flex-col items-center justify-center gap-1 ' +
                (charType === 'traditional'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300')
              }
            >
              <span className="text-xl chinese-text">繁體</span>
              <span className="text-xs">Traditional</span>
            </button>
            <button
              onClick={() => handleCharTypeChange('simplified')}
              className={
                'py-3 px-4 rounded-lg flex flex-col items-center justify-center gap-1 ' +
                (charType === 'simplified'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300')
              }
            >
              <span className="text-xl chinese-text">简体</span>
              <span className="text-xs">Simplified</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTheme('light')}
              className={
                'py-3 px-4 rounded-lg flex items-center justify-center gap-2 ' +
                (theme === 'light'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300')
              }
            >
              <Sun size={18} /> Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={
                'py-3 px-4 rounded-lg flex items-center justify-center gap-2 ' +
                (theme === 'dark'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300')
              }
            >
              <Moon size={18} /> Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className={
                'py-3 px-4 rounded-lg flex items-center justify-center gap-2 ' +
                (theme === 'system'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300')
              }
            >
              <Monitor size={18} /> Auto
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Data Backup
          </label>
          <div className="space-y-2">
            <button
              onClick={handleExport}
              className="w-full py-3 px-4 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
            >
              <Download size={18} /> Export Data
            </button>
            <label className="w-full py-3 px-4 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 cursor-pointer">
              <Upload size={18} /> {importing ? 'Importing...' : 'Import Data'}
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                disabled={importing}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Export your flashcards as a JSON file for backup
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            RaminCards v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
