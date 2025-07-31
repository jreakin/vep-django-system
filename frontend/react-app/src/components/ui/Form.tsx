import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, ...props }, ref) => {
    return (
      <div className="tw-w-full">
        {label && (
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            {label}
          </label>
        )}
        <input
          className={`tw-flex tw-h-10 tw-w-full tw-rounded-md tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-ring-offset-white file:tw-border-0 file:tw-bg-transparent file:tw-text-sm file:tw-font-medium placeholder:tw-text-gray-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-blue-500 focus-visible:tw-ring-offset-2 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${error ? 'tw-border-red-500 focus-visible:tw-ring-red-500' : ''} ${className}`}
          ref={ref}
          {...props}
        />
        {(error || helperText) && (
          <p className={`tw-mt-1 tw-text-sm ${error ? 'tw-text-red-600' : 'tw-text-gray-500'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = 'default', size = 'default', children, ...props }, ref) => {
    const baseClasses = "tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-text-sm tw-font-medium tw-ring-offset-white tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-blue-500 focus-visible:tw-ring-offset-2 disabled:tw-pointer-events-none disabled:tw-opacity-50"
    
    const variants = {
      default: "tw-bg-blue-600 tw-text-white hover:tw-bg-blue-700",
      destructive: "tw-bg-red-600 tw-text-white hover:tw-bg-red-700",
      outline: "tw-border tw-border-gray-300 tw-bg-white tw-text-gray-700 hover:tw-bg-gray-50",
      secondary: "tw-bg-gray-100 tw-text-gray-900 hover:tw-bg-gray-200",
      ghost: "tw-text-gray-700 hover:tw-bg-gray-100",
      link: "tw-text-blue-600 tw-underline-offset-4 hover:tw-underline",
    }

    const sizes = {
      default: "tw-h-10 tw-px-4 tw-py-2",
      sm: "tw-h-9 tw-rounded-md tw-px-3",
      lg: "tw-h-11 tw-rounded-md tw-px-8",
      icon: "tw-h-10 tw-w-10",
    }

    return (
      <button
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </button>
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
    return (
      <div className="tw-w-full">
        {label && (
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            {label}
          </label>
        )}
        <textarea
          className={`tw-flex tw-min-h-20 tw-w-full tw-rounded-md tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-ring-offset-white placeholder:tw-text-gray-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-blue-500 focus-visible:tw-ring-offset-2 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${error ? 'tw-border-red-500 focus-visible:tw-ring-red-500' : ''} ${className}`}
          ref={ref}
          {...props}
        />
        {(error || helperText) && (
          <p className={`tw-mt-1 tw-text-sm ${error ? 'tw-text-red-600' : 'tw-text-gray-500'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"