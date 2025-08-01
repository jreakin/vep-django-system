import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface DropdownProps {
  children: ReactNode
  trigger: ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export const Dropdown = ({ children, trigger, align = 'start', side = 'bottom' }: DropdownProps) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="tw-min-w-56 tw-rounded-md tw-border tw-bg-white tw-p-1 tw-shadow-md tw-z-50"
          align={align}
          side={side}
          sideOffset={5}
        >
          {children}
          <DropdownMenu.Arrow className="tw-fill-white" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

interface DropdownItemProps {
  children: ReactNode
  onSelect?: () => void
  disabled?: boolean
  className?: string
}

export const DropdownItem = ({ children, onSelect, disabled, className = "" }: DropdownItemProps) => {
  return (
    <DropdownMenu.Item
      className={`tw-relative tw-flex tw-cursor-default tw-select-none tw-items-center tw-rounded-sm tw-px-2 tw-py-1.5 tw-text-sm tw-outline-none tw-transition-colors focus:tw-bg-gray-100 data-[disabled]:tw-pointer-events-none data-[disabled]:tw-opacity-50 ${className}`}
      onSelect={onSelect}
      disabled={disabled}
    >
      {children}
    </DropdownMenu.Item>
  )
}

export const DropdownSeparator = () => {
  return <DropdownMenu.Separator className="tw--mx-1 tw-my-1 tw-h-px tw-bg-gray-200" />
}

export const DropdownLabel = ({ children }: { children: ReactNode }) => {
  return (
    <DropdownMenu.Label className="tw-px-2 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-gray-900">
      {children}
    </DropdownMenu.Label>
  )
}

// Dropdown button with built-in chevron
interface DropdownButtonProps {
  children: ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
}

export const DropdownButton = ({ children, variant = 'default', className = "" }: DropdownButtonProps) => {
  const baseClasses = "tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-transition-colors focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-ring-offset-2"
  
  const variants = {
    default: "tw-bg-blue-600 tw-text-white hover:tw-bg-blue-700",
    outline: "tw-border tw-border-gray-300 tw-bg-white tw-text-gray-700 hover:tw-bg-gray-50",
    ghost: "tw-text-gray-700 hover:tw-bg-gray-100"
  }

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
      <ChevronDown className="tw-ml-2 tw-h-4 tw-w-4" />
    </button>
  )
}