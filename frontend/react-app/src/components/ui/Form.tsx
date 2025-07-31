import { forwardRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    return (
      <motion.div 
        className="tw-w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label && (
          <motion.label 
            className="tw-block tw-text-sm tw-font-medium tw-text-text-primary tw-mb-2"
            animate={{ 
              color: isFocused ? 'var(--color-primary)' : 'var(--color-text-primary)',
              scale: isFocused ? 1.02 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}
        <motion.input
          className={`tw-flex tw-h-11 tw-w-full tw-rounded-lg tw-border tw-bg-background tw-px-4 tw-py-2 tw-text-sm tw-text-text-primary tw-transition-all tw-duration-200 file:tw-border-0 file:tw-bg-transparent file:tw-text-sm file:tw-font-medium placeholder:tw-text-text-muted focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary focus-visible:tw-ring-offset-2 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${
            error 
              ? 'tw-border-error focus-visible:tw-ring-error' 
              : 'tw-border-border focus-visible:tw-border-primary hover:tw-border-primary/50'
          } ${className}`}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          whileFocus={{ translateY: -2 }}
          transition={{ duration: 0.2 }}
          style={{ willChange: 'transform' }}
          {...props}
        />
        {(error || helperText) && (
          <motion.p 
            className={`tw-mt-2 tw-text-sm ${error ? 'tw-text-error' : 'tw-text-text-muted'}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error || helperText}
          </motion.p>
        )}
      </motion.div>
    )
  }
)

Input.displayName = "Input"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children: ReactNode
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = 'default', size = 'default', children, loading = false, ...props }, ref) => {
    const baseClasses = "tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-text-sm tw-font-medium tw-transition-all tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary focus-visible:tw-ring-offset-2 disabled:tw-pointer-events-none disabled:tw-opacity-50"
    
    const variants = {
      default: "tw-bg-primary tw-text-white hover:tw-bg-primary/90 tw-shadow-sm hover:tw-shadow-md",
      destructive: "tw-bg-error tw-text-white hover:tw-bg-error/90 tw-shadow-sm hover:tw-shadow-md",
      outline: "tw-border tw-border-border tw-bg-background tw-text-text-primary hover:tw-bg-surface hover:tw-border-primary/50",
      secondary: "tw-bg-surface tw-text-text-primary hover:tw-bg-surface/80 tw-shadow-sm",
      ghost: "tw-text-text-primary hover:tw-bg-surface",
      link: "tw-text-primary tw-underline-offset-4 hover:tw-underline",
      gradient: "tw-bg-gradient-to-r tw-from-primary tw-to-secondary tw-text-white hover:tw-opacity-90 tw-shadow-lg hover:tw-shadow-xl"
    }

    const sizes = {
      default: "tw-h-11 tw-px-6 tw-py-2",
      sm: "tw-h-9 tw-px-4 tw-text-xs",
      lg: "tw-h-12 tw-px-8 tw-text-base",
      icon: "tw-h-11 tw-w-11",
    }

    return (
      <motion.button
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        whileHover={{ scale: props.disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: props.disabled || loading ? 1 : 0.98 }}
        style={{ willChange: 'transform' }}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading && (
          <motion.div
            className="tw-mr-2 tw-h-4 tw-w-4 tw-border-2 tw-border-white/30 tw-border-t-white tw-rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = "Button"

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, helperText, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    return (
      <motion.div 
        className="tw-w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label && (
          <motion.label 
            className="tw-block tw-text-sm tw-font-medium tw-text-text-primary tw-mb-2"
            animate={{ 
              color: isFocused ? 'var(--color-primary)' : 'var(--color-text-primary)',
              scale: isFocused ? 1.02 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}
        <textarea
          className={`tw-flex tw-min-h-24 tw-w-full tw-rounded-lg tw-border tw-bg-background tw-px-4 tw-py-3 tw-text-sm tw-text-text-primary tw-transition-all tw-duration-200 placeholder:tw-text-text-muted focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary focus-visible:tw-ring-offset-2 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 tw-resize-none ${
            error 
              ? 'tw-border-error focus-visible:tw-ring-error' 
              : 'tw-border-border focus-visible:tw-border-primary hover:tw-border-primary/50'
          } ${className}`}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          whileFocus={{ translateY: -2 }}
          transition={{ duration: 0.2 }}
          style={{ willChange: 'transform' }}
          {...props}
        />
        {(error || helperText) && (
          <motion.p 
            className={`tw-mt-2 tw-text-sm ${error ? 'tw-text-error' : 'tw-text-text-muted'}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error || helperText}
          </motion.p>
        )}
      </motion.div>
    )
  }
)

Textarea.displayName = "Textarea"