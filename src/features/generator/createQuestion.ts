import type { AppSettings, Op, Question } from '../../shared/types'

export function createQuestion(settings: AppSettings): Question {
  const op = pick(settings.ops)
  const max = Math.max(1, Math.floor(settings.rangeMax))

  for (let i = 0; i < 200; i++) {
    const a = randInt(settings.allowZero ? 0 : 1, max)
    const b = randInt(settings.allowZero ? 0 : 1, max)
    const q = build(op, a, b, settings)
    if (q) return q
  }

  // 兜底：保证一定返回（避免 UI 卡死）
  return {
    id: crypto.randomUUID(),
    op: 'add',
    a: 1,
    b: 1,
    answer: 2,
  }
}

function build(op: Op, a: number, b: number, settings: AppSettings): Question | null {
  switch (op) {
    case 'add': {
      const ans = a + b
      if (ans > settings.rangeMax) return null
      return { id: crypto.randomUUID(), op, a, b, answer: ans }
    }
    case 'sub': {
      const ans = a - b
      if (!settings.allowNegative && ans < 0) return null
      return { id: crypto.randomUUID(), op, a, b, answer: ans }
    }
    case 'mul': {
      const ans = a * b
      if (ans > settings.rangeMax) return null
      return { id: crypto.randomUUID(), op, a, b, answer: ans }
    }
    case 'div': {
      if (b === 0) return null
      if (settings.requireIntegerDivision && a % b !== 0) return null
      const ans = a / b
      if (!Number.isFinite(ans)) return null
      if (!settings.allowNegative && ans < 0) return null
      if (ans > settings.rangeMax) return null
      return { id: crypto.randomUUID(), op, a, b, answer: ans }
    }
  }
}

function randInt(min: number, max: number) {
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

