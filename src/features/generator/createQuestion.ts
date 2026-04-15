import type { AppSettings, Op, Question } from '../../shared/types'

export function createQuestion(settings: AppSettings): Question {
  const op = pick(settings.ops)
  const max = Math.max(1, Math.floor(settings.rangeMax))
  const min = settings.allowZero ? 0 : 2

  for (let i = 0; i < 200; i++) {
    const a = randInt(min, max)
    const b = randInt(min, max)
    if (a === 1 || b === 1) continue
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

export function createMakeTargetQuestion(settings: AppSettings): Question {
  // 目标权重：提高 100 的出现频率
  const targets: Array<10 | 20 | 100> = [10, 20, 100]
  const rangeMax = Math.max(1, Math.floor(settings.rangeMax))

  // 约束：
  // - b < 10（专门练凑整）
  // - 结果不为 10 的倍数：由于 T 为 10 的倍数，所以要求 y 不为 0 即可
  for (let i = 0; i < 200; i++) {
    const T = targets[Math.floor(Math.random() * targets.length)]
    const x = randInt(1, 8)
    const a = T - x
    // 对于凑 100：如果按设置 rangeMax=100，会导致 y 永远为 0（又被约束禁止），从而 100 永远出不来。
    // 这里对该练习放宽上限到 T+8（且仍保持 b<10 与 y>=1），保证三种目标都可生成。
    const effectiveMax = Math.max(rangeMax, T + 8)
    const yMax = Math.min(Math.max(0, effectiveMax - T), 9 - x)
    if (yMax < 1) continue
    const y = randInt(1, yMax)

    const b = x + y
    const ans = a + b
    if (ans % 10 === 0) continue

    return {
      id: crypto.randomUUID(),
      op: 'add',
      a,
      b,
      answer: ans,
      strategy: 'makeTarget',
      strategyTarget: T,
      expectedSteps: { x, y, result: ans },
    }
  }

  // 兜底：极端设置（如 rangeMax 太小）时保证不崩溃
  const x = 1
  const y = 1
  const a = 9
  const b = 2
  const ans = 11

  return {
    id: crypto.randomUUID(),
    op: 'add',
    a,
    b,
    answer: ans,
    strategy: 'makeTarget',
    strategyTarget: 10,
    expectedSteps: { x, y, result: ans },
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

