import * as Tabs from '@radix-ui/react-tabs'
import { motion, AnimatePresence } from 'framer-motion'
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
    <Tabs.List className={`tw-inline-flex tw-h-12 tw-items-center tw-justify-center tw-rounded-lg tw-bg-surface tw-p-1 tw-border tw-border-border tw-shadow-sm ${className}`}>
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
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ willChange: 'transform' }}
    >
      <Tabs.Trigger
        value={value}
        className={`tw-inline-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-md tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-transition-all tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary focus-visible:tw-ring-offset-2 disabled:tw-pointer-events-none disabled:tw-opacity-50 tw-text-text-secondary hover:tw-text-text-primary data-[state=active]:tw-bg-background data-[state=active]:tw-text-text-primary data-[state=active]:tw-shadow-sm tw-relative ${className}`}
      >
        {children}
      </Tabs.Trigger>
    </motion.div>
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
      className={`tw-mt-6 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary focus-visible:tw-ring-offset-2 ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut"
          }}
          style={{ willChange: 'transform, opacity' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </Tabs.Content>
  )
}