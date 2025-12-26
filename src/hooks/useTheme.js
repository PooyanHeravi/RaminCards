import { useState, useEffect } from 'react'
import { getSetting, setSetting } from '../db/database'

export function useTheme() {
  const [theme, setThemeState] = useState('system')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Load saved theme
    getSetting('theme').then(saved => {
      if (saved) setThemeState(saved)
    })
  }, [])

  useEffect(() => {
    // Apply theme
    const applyTheme = () => {
      let dark = false
      if (theme === 'dark') {
        dark = true
      } else if (theme === 'system') {
        dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      
      setIsDark(dark)
      document.documentElement.classList.toggle('dark', dark)
    }

    applyTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', applyTheme)
    
    return () => mediaQuery.removeEventListener('change', applyTheme)
  }, [theme])

  const setTheme = async (newTheme) => {
    setThemeState(newTheme)
    await setSetting('theme', newTheme)
  }

  return { theme, isDark, setTheme }
}
