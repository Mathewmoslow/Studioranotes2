'use client'

import { useCanvasAutoSync } from '@/hooks/useCanvasAutoSync'
import { ArchivePrompt } from './ArchivePrompt'

/**
 * Provider component that initializes background services on app load:
 * - Canvas auto-sync: Syncs new assignments when user logs in
 * - Auto-archive: Prompts to archive courses 10 days after semester ends
 */
export function AutoSyncProvider({ children }: { children: React.ReactNode }) {
  // Initialize the auto-sync hook - it handles sync timing internally
  useCanvasAutoSync()

  return (
    <>
      {children}
      <ArchivePrompt />
    </>
  )
}
