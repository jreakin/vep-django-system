import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export const Modal = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children, 
  className = "" 
}: ModalProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-50" />
        <Dialog.Content className={`tw-fixed tw-left-1/2 tw-top-1/2 tw-z-50 tw-w-full tw-max-w-lg tw--translate-x-1/2 tw--translate-y-1/2 tw-rounded-lg tw-border tw-bg-white tw-p-6 tw-shadow-lg ${className}`}>
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
            {title && (
              <Dialog.Title className="tw-text-lg tw-font-semibold tw-text-gray-900">
                {title}
              </Dialog.Title>
            )}
            <Dialog.Close className="tw-rounded-sm tw-opacity-70 tw-ring-offset-white tw-transition-opacity hover:tw-opacity-100 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-ring-offset-2">
              <X className="tw-h-4 tw-w-4" />
              <span className="tw-sr-only">Close</span>
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description className="tw-text-sm tw-text-gray-600 tw-mb-4">
              {description}
            </Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const ModalTrigger = Dialog.Trigger
export const ModalClose = Dialog.Close