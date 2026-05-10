import type { AppSettings, AttemptRecord } from '../shared/types'
import type { LifetimeTotals, StorageProvider } from './storageProvider'

const SETTINGS_KEY = 'mathSense.settings.v1'
const ATTEMPTS_KEY = 'mathSense.attempts.v1'
const LIFETIME_KEY = 'mathSense.lifetime.v1'

export class LocalStorageProvider implements StorageProvider {
  loadSettings(): AppSettings | null {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AppSettings
    } catch {
      return null
    }
  }

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }

  appendAttempt(attempt: AttemptRecord): void {
    const list = this._loadAttempts()
    list.push(attempt)
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(list))
  }

  listAttempts(limit: number): AttemptRecord[] {
    const list = this._loadAttempts()
    if (limit <= 0) return []
    return list.slice(Math.max(0, list.length - limit))
  }

  clearAttempts(): void {
    localStorage.removeItem(ATTEMPTS_KEY)
  }

  getLifetimeTotals(): LifetimeTotals {
    return { ...this._loadLifetime() }
  }

  recordSessionFinish(totalQuestions: number, correctCount: number): void {
    const t = this._loadLifetime()
    const addQ = Math.max(0, Math.floor(totalQuestions))
    const addC = Math.max(0, Math.floor(correctCount))
    t.questions += addQ
    t.correct += Math.min(addC, addQ)
    localStorage.setItem(LIFETIME_KEY, JSON.stringify(t))
  }

  private _loadLifetime(): LifetimeTotals {
    const raw = localStorage.getItem(LIFETIME_KEY)
    if (!raw) return { questions: 0, correct: 0 }
    try {
      const o = JSON.parse(raw) as unknown
      if (!o || typeof o !== 'object') return { questions: 0, correct: 0 }
      const questions = Number((o as { questions?: unknown }).questions)
      const correct = Number((o as { correct?: unknown }).correct)
      const q = Number.isFinite(questions) ? Math.max(0, Math.floor(questions)) : 0
      const c0 = Number.isFinite(correct) ? Math.max(0, Math.floor(correct)) : 0
      return { questions: q, correct: Math.min(c0, q) }
    } catch {
      return { questions: 0, correct: 0 }
    }
  }

  private _loadAttempts(): AttemptRecord[] {
    const raw = localStorage.getItem(ATTEMPTS_KEY)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as AttemptRecord[]) : []
    } catch {
      return []
    }
  }
}

