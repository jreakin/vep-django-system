import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeVariant = 'default' | 'campaign' | 'accessibility' | 'professional'

interface Theme {
  mode: ThemeMode
  variant: ThemeVariant
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: {
      primary: string
      secondary: string
      muted: string
    }
    border: string
    success: string
    warning: string
    error: string
    info: string
  }
  gradients: {
    primary: string
    secondary: string
    hero: string
  }
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  animation: {
    duration: {
      fast: string
      normal: string
      slow: string
    }
    easing: {
      easeInOut: string
      easeOut: string
      spring: string
    }
  }
}

interface ThemeContextType {
  theme: Theme
  setMode: (mode: ThemeMode) => void
  setVariant: (variant: ThemeVariant) => void
  isDark: boolean
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Theme configurations
const createTheme = (mode: 'light' | 'dark', variant: ThemeVariant): Theme => {
  const isDark = mode === 'dark'
  
  const baseColors = {
    light: {
      background: '#ffffff',
      surface: '#f8fafc',
      text: {
        primary: '#1e293b',
        secondary: '#475569',
        muted: '#64748b'
      },
      border: '#e2e8f0'
    },
    dark: {
      background: '#0f172a',
      surface: '#1e293b',
      text: {
        primary: '#f1f5f9',
        secondary: '#cbd5e1',
        muted: '#94a3b8'
      },
      border: '#334155'
    }
  }

  const variantColors = {
    default: {
      primary: isDark ? '#3b82f6' : '#2563eb',
      secondary: isDark ? '#8b5cf6' : '#7c3aed',
      accent: isDark ? '#06b6d4' : '#0891b2'
    },
    campaign: {
      primary: isDark ? '#dc2626' : '#b91c1c',
      secondary: isDark ? '#1d4ed8' : '#1e40af',
      accent: isDark ? '#059669' : '#047857'
    },
    accessibility: {
      primary: isDark ? '#facc15' : '#eab308',
      secondary: isDark ? '#a855f7' : '#9333ea',
      accent: isDark ? '#10b981' : '#059669'
    },
    professional: {
      primary: isDark ? '#475569' : '#334155',
      secondary: isDark ? '#6366f1' : '#4f46e5',
      accent: isDark ? '#0891b2' : '#0284c7'
    }
  }

  const base = baseColors[mode]
  const colors = variantColors[variant]

  return {
    mode: mode as ThemeMode,
    variant,
    colors: {
      ...colors,
      ...base,
      success: isDark ? '#10b981' : '#059669',
      warning: isDark ? '#f59e0b' : '#d97706',
      error: isDark ? '#ef4444' : '#dc2626',
      info: isDark ? '#3b82f6' : '#2563eb'
    },
    gradients: {
      primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
      secondary: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.accent} 100%)`,
      hero: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.secondary}10 50%, ${colors.accent}20 100%)`
    },
    shadows: {
      sm: isDark 
        ? '0 1px 2px 0 rgba(0, 0, 0, 0.3)' 
        : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: isDark 
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' 
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: isDark 
        ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' 
        : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: isDark 
        ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' 
        : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    animation: {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms'
      },
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }
    }
  }
}

// Get system preference
const getSystemPreference = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Theme provider component
interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [variant, setVariantState] = useState<ThemeVariant>('default')
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light')

  // Initialize theme from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode
    const savedVariant = localStorage.getItem('theme-variant') as ThemeVariant
    
    if (savedMode) setModeState(savedMode)
    if (savedVariant) setVariantState(savedVariant)
    
    setSystemPreference(getSystemPreference())
  }, [])

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Apply theme to document
  useEffect(() => {
    const actualMode = mode === 'system' ? systemPreference : mode
    const theme = createTheme(actualMode, variant)
    
    // Apply CSS custom properties
    const root = document.documentElement
    root.style.setProperty('--color-primary', theme.colors.primary)
    root.style.setProperty('--color-secondary', theme.colors.secondary)
    root.style.setProperty('--color-accent', theme.colors.accent)
    root.style.setProperty('--color-background', theme.colors.background)
    root.style.setProperty('--color-surface', theme.colors.surface)
    root.style.setProperty('--color-text-primary', theme.colors.text.primary)
    root.style.setProperty('--color-text-secondary', theme.colors.text.secondary)
    root.style.setProperty('--color-text-muted', theme.colors.text.muted)
    root.style.setProperty('--color-border', theme.colors.border)
    root.style.setProperty('--color-success', theme.colors.success)
    root.style.setProperty('--color-warning', theme.colors.warning)
    root.style.setProperty('--color-error', theme.colors.error)
    root.style.setProperty('--color-info', theme.colors.info)
    
    // Apply gradients
    root.style.setProperty('--gradient-primary', theme.gradients.primary)
    root.style.setProperty('--gradient-secondary', theme.gradients.secondary)
    root.style.setProperty('--gradient-hero', theme.gradients.hero)
    
    // Apply shadows
    root.style.setProperty('--shadow-sm', theme.shadows.sm)
    root.style.setProperty('--shadow-md', theme.shadows.md)
    root.style.setProperty('--shadow-lg', theme.shadows.lg)
    root.style.setProperty('--shadow-xl', theme.shadows.xl)
    
    // Apply animation variables
    root.style.setProperty('--duration-fast', theme.animation.duration.fast)
    root.style.setProperty('--duration-normal', theme.animation.duration.normal)
    root.style.setProperty('--duration-slow', theme.animation.duration.slow)
    root.style.setProperty('--easing-ease-in-out', theme.animation.easing.easeInOut)
    root.style.setProperty('--easing-ease-out', theme.animation.easing.easeOut)
    root.style.setProperty('--easing-spring', theme.animation.easing.spring)
    
    // Update class on html element for dark mode
    if (actualMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [mode, variant, systemPreference])

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem('theme-mode', newMode)
  }

  const setVariant = (newVariant: ThemeVariant) => {
    setVariantState(newVariant)
    localStorage.setItem('theme-variant', newVariant)
  }

  const toggleMode = () => {
    if (mode === 'light') {
      setMode('dark')
    } else if (mode === 'dark') {
      setMode('system')
    } else {
      setMode('light')
    }
  }

  const actualMode = mode === 'system' ? systemPreference : mode
  const theme = createTheme(actualMode, variant)
  const isDark = actualMode === 'dark'

  const value: ThemeContextType = {
    theme,
    setMode,
    setVariant,
    isDark,
    toggleMode
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext