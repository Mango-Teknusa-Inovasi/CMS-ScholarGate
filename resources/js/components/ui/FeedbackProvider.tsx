import type { ReactNode } from 'react'
import { ToastProvider } from './Toast'
import { ConfirmProvider } from './ConfirmModal'
import { PromptProvider } from './PromptModal'

/** Toast + confirm modal + prompt modal for the whole app */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <PromptProvider>{children}</PromptProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}
