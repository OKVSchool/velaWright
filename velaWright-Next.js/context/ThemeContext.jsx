'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const DEFAULT_ACCENT = '#e07820'
const DEFAULT_FONT = 'basic'

const FONT_SETS = {
  basic: {
    '--font-brand':  "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    '--font-body':   "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    '--font-tab':    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    '--font-saying': "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  default: {
    '--font-brand':  "'Oldenburg', serif",
    '--font-body':   "'Lora', serif",
    '--font-tab':    "'Cinzel', serif",
    '--font-saying': "'IM Fell Double Pica SC', serif",
  },
}

function applyFonts(mode) {
  const set = FONT_SETS[mode] || FONT_SETS.basic
  Object.entries(set).forEach(([prop, val]) => {
    document.documentElement.style.setProperty(prop, val)
  })
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [accent, setAccentState] = useState(DEFAULT_ACCENT)
  const [fontMode, setFontModeState] = useState(DEFAULT_FONT)

  useEffect(() => {
    const storedAccent = localStorage.getItem('vw_accent') || DEFAULT_ACCENT
    const storedFont   = localStorage.getItem('vw_font')   || DEFAULT_FONT

    setAccentState(storedAccent)
    document.documentElement.style.setProperty('--accent', storedAccent)

    setFontModeState(storedFont)
    applyFonts(storedFont)
  }, [])

  function setAccent(color) {
    setAccentState(color)
    localStorage.setItem('vw_accent', color)
    document.documentElement.style.setProperty('--accent', color)
  }

  function resetAccent() {
    setAccentState(DEFAULT_ACCENT)
    localStorage.removeItem('vw_accent')
    document.documentElement.style.setProperty('--accent', DEFAULT_ACCENT)
  }

  function setFontMode(mode) {
    setFontModeState(mode)
    localStorage.setItem('vw_font', mode)
    applyFonts(mode)
  }

  return (
    <ThemeContext.Provider value={{ accent, setAccent, resetAccent, fontMode, setFontMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
