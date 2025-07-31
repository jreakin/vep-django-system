import * as Tabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

export const TabsRoot = ({ defaultValue, value, onValueChange, children, className = "" }: TabsProps) => {
  return (
    <Tabs.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={`tw-w-full ${className}`}
    >
      {children}
    </Tabs.Root>
  )
}

interface TabsListProps {
  children: ReactNode
  className?: string
}

export const TabsList = ({ children, className = "" }: TabsListProps) => {
  return (
    <Tabs.List className={`tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-md tw-bg-gray-100 tw-p-1 tw-text-gray-500 ${className}`}>
      {children}
    </Tabs.List>
  )
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
}

export const TabsTrigger = ({ value, children, className = "" }: TabsTriggerProps) => {
  return (
    <Tabs.Trigger
      value={value}
      className={`tw-inline-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-sm tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-ring-offset-white tw-transition-all focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-blue-500 focus-visible:tw-ring-offset-2 disabled:tw-pointer-events-none disabled:tw-opacity-50 data-[state=active]:tw-bg-white data-[state=active]:tw-text-gray-950 data-[state=active]:tw-shadow-sm ${className}`}
    >
      {children}
    </Tabs.Trigger>
  )
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export const TabsContent = ({ value, children, className = "" }: TabsContentProps) => {
  return (
    <Tabs.Content
      value={value}
      className={`tw-mt-2 tw-ring-offset-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-blue-500 focus-visible:tw-ring-offset-2 ${className}`}
    >
      {children}
    </Tabs.Content>
  )
}