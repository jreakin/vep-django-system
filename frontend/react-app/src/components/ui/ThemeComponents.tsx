import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type ThemeMode, type ThemeVariant } from '../../contexts/ThemeContext'

// Theme mode toggle component
interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false
}) => {
  const { theme, toggleMode, isDark } = useTheme()

  const getIcon = () => {
    switch (theme.mode) {
      case 'light':
        return <Sun className="tw-h-4 tw-w-4" />
      case 'dark':
        return <Moon className="tw-h-4 tw-w-4" />
      case 'system':
        return <Monitor className="tw-h-4 tw-w-4" />
      default:
        return <Sun className="tw-h-4 tw-w-4" />
    }
  }

  const getLabel = () => {
    switch (theme.mode) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'system':
        return 'System'
      default:
        return 'Light'
    }
  }

  return (
    <motion.button
      className={`tw-inline-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-rounded-md tw-text-sm tw-font-medium tw-transition-colors tw-border tw-border-border hover:tw-bg-surface tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-primary tw-focus:ring-offset-2 ${className}`}
      onClick={toggleMode}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ willChange: 'transform' }}
    >
      <motion.div
        key={theme.mode}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {getIcon()}
      </motion.div>
      {showLabel && (
        <span className="tw-text-text-primary">{getLabel()}</span>
      )}
    </motion.button>
  )
}

// Theme variant selector
interface ThemeVariantSelectorProps {
  className?: string
}

export const ThemeVariantSelector: React.FC<ThemeVariantSelectorProps> = ({
  className = ''
}) => {
  const { theme, setVariant } = useTheme()

  const variants: { value: ThemeVariant; label: string; description: string }[] = [
    { value: 'default', label: 'Default', description: 'Clean and modern' },
    { value: 'campaign', label: 'Campaign', description: 'Bold and energetic' },
    { value: 'accessibility', label: 'Accessibility', description: 'High contrast' },
    { value: 'professional', label: 'Professional', description: 'Minimal and clean' }
  ]

  return (
    <div className={`tw-space-y-3 ${className}`}>
      <h3 className="tw-text-sm tw-font-medium tw-text-text-primary">Theme Variant</h3>
      <div className="tw-grid tw-grid-cols-2 tw-gap-2">
        {variants.map((variant) => (
          <motion.button
            key={variant.value}
            className={`tw-p-3 tw-rounded-lg tw-border tw-transition-all tw-text-left ${
              theme.variant === variant.value
                ? 'tw-border-primary tw-bg-primary/10 tw-ring-2 tw-ring-primary/20'
                : 'tw-border-border hover:tw-border-primary/50 hover:tw-bg-surface'
            }`}
            onClick={() => setVariant(variant.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ willChange: 'transform' }}
          >
            <div className="tw-font-medium tw-text-sm tw-text-text-primary">
              {variant.label}
            </div>
            <div className="tw-text-xs tw-text-text-muted tw-mt-1">
              {variant.description}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// Theme customization panel
interface ThemeCustomizationPanelProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export const ThemeCustomizationPanel: React.FC<ThemeCustomizationPanelProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  if (!isOpen) return null

  return (
    <motion.div
      className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="tw-bg-background tw-rounded-lg tw-shadow-xl tw-border tw-border-border tw-p-6 tw-max-w-md tw-w-full tw-max-h-96 tw-overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <h2 className="tw-text-lg tw-font-semibold tw-text-text-primary">
            Theme Settings
          </h2>
          <motion.button
            className="tw-p-2 tw-rounded-md hover:tw-bg-surface tw-transition-colors"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="tw-h-5 tw-w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>

        <div className="tw-space-y-6">
          <div>
            <h3 className="tw-text-sm tw-font-medium tw-text-text-primary tw-mb-3">
              Appearance
            </h3>
            <ThemeToggle showLabel />
          </div>

          <ThemeVariantSelector />
        </div>
      </motion.div>
    </motion.div>
  )
}

// Preview theme colors component
export const ThemeColorPreview: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme } = useTheme()

  const colors = [
    { name: 'Primary', value: theme.colors.primary },
    { name: 'Secondary', value: theme.colors.secondary },
    { name: 'Accent', value: theme.colors.accent },
    { name: 'Success', value: theme.colors.success },
    { name: 'Warning', value: theme.colors.warning },
    { name: 'Error', value: theme.colors.error }
  ]

  return (
    <div className={`tw-grid tw-grid-cols-3 tw-gap-2 ${className}`}>
      {colors.map((color) => (
        <motion.div
          key={color.name}
          className="tw-text-center"
          whileHover={{ scale: 1.05 }}
          style={{ willChange: 'transform' }}
        >
          <div
            className="tw-w-12 tw-h-12 tw-rounded-lg tw-mx-auto tw-mb-1 tw-border tw-border-border"
            style={{ backgroundColor: color.value }}
          />
          <div className="tw-text-xs tw-text-text-muted">{color.name}</div>
        </motion.div>
      ))}
    </div>
  )
}

export default {
  ThemeToggle,
  ThemeVariantSelector,
  ThemeCustomizationPanel,
  ThemeColorPreview
}