import type { AppSettings, AttemptRecord } from '../shared/types'

export interface LifetimeTotals {
  questions: number
  correct: number
}

export interface StorageProvider {
  loadSettings(): AppSettings | null
  saveSettings(settings: AppSettings): void

  appendAttempt(attempt: AttemptRecord): void
  listAttempts(limit: number): AttemptRecord[]
  clearAttempts(): void

  getLifetimeTotals(): LifetimeTotals
  recordSessionFinish(totalQuestions: number, correctCount: number): void
}

