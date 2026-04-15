import type { AppSettings, AttemptRecord } from '../shared/types'
import type { StorageProvider } from './storageProvider'

const SETTINGS_KEY = 'mathSense.settings.v1'
const ATTEMPTS_KEY = 'mathSense.attempts.v1'

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

