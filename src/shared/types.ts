export type Op = 'add' | 'sub' | 'mul' | 'div'

export type PracticeMode = 'direct' | 'strategy'

export interface AppSettings {
  rangeMax: number
  allowZero: boolean
  allowNegative: boolean
  requireIntegerDivision: boolean
  ops: Op[]
  questionsPerRound: number
}

export interface Question {
  id: string
  op: Op
  a: number
  b: number
  answer: number

  strategy?: 'makeTarget'
  strategyTarget?: 10 | 20 | 100
  expectedSteps?: { x: number; y: number; result: number }
}

export interface AttemptRecord {
  id: string
  question: Question
  userAnswer: number
  correct: boolean
  startedAt: number
  answeredAt: number
}

export interface SessionResult {
  sessionId: string
  total: number
  correct: number
  avgMs: number
  attempts: AttemptRecord[]
}

