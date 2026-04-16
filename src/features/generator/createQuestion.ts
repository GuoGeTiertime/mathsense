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

export function createEstimateQuestion(settings: AppSettings): Question {
  const max = Math.max(1, Math.floor(settings.rangeMax))
  const min = settings.allowZero ? 0 : 2
  const ops: Array<Extract<Op, 'add' | 'sub' | 'mul'>> = ['add', 'sub', 'mul']
  const nearD = 2

  for (let i = 0; i < 400; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)]
    const q = buildEstimate(op, min, max, nearD, settings)
    if (q) return q
  }

  // 兜底：极端设置时保证不崩溃
  return {
    id: crypto.randomUUID(),
    op: 'add',
    a: 8,
    b: 11,
    answer: 18,
    strategy: 'estimate',
    choices: shuffle([18, 8, 28]),
  }
}

export function createMakeSumTargetQuestion(settings: AppSettings): Question {
  const rangeMax = Math.max(1, Math.floor(settings.rangeMax))
  const min = settings.allowZero ? 0 : 2
  const allTargets: Array<10 | 20 | 50 | 100> = [10, 20, 50, 100]
  const targets = allTargets.filter((t) => t <= rangeMax)
  const usable = targets.length > 0 ? targets : ([10] as Array<10>)

  for (let i = 0; i < 200; i++) {
    const T = usable[Math.floor(Math.random() * usable.length)]
    const aMax = Math.min(rangeMax, T - 1) // □ 不允许为 0
    if (aMax < min) continue
    const a = randInt(min, aMax)
    if (a === 1) continue
    const ans = T - a
    if (ans === 0) continue
    if (!Number.isFinite(ans)) continue

    return {
      id: crypto.randomUUID(),
      op: 'add',
      a,
      b: T,
      answer: ans,
      strategy: 'makeSumTarget',
      strategyTarget: T,
    }
  }

  // 兜底
  return {
    id: crypto.randomUUID(),
    op: 'add',
    a: 7,
    b: 10,
    answer: 3,
    strategy: 'makeSumTarget',
    strategyTarget: 10,
  }
}

export function createMixedQuestion(settings: AppSettings): Question {
  const r = Math.random()
  if (r < 0.4) return createQuestion(settings)
  if (r < 0.6) return createMakeTargetQuestion(settings)
  if (r < 0.8) return createEstimateQuestion(settings)
  return createMakeSumTargetQuestion(settings)
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

function buildEstimate(
  op: Extract<Op, 'add' | 'sub' | 'mul'>,
  min: number,
  max: number,
  nearD: number,
  settings: AppSettings,
): Question | null {
  if (op === 'mul') {
    // 生成：a 靠近某个整十 T，估算只把 a 凑到 T
    const maxTen = Math.floor(max / 10) * 10
    if (maxTen < 10) return null
    const T = (randInt(1, Math.floor(maxTen / 10)) * 10) as number
    const delta = randInt(1, nearD)
    const a = Math.random() < 0.5 ? T - delta : T + delta
    if (a < min || a > max) return null

    const bMax = Math.floor(max / T)
    if (bMax < 2) return null
    const b = randInt(Math.max(2, min), Math.min(max, bMax))
    if (a === 1 || b === 1) return null

    const answer = T * b
    if (answer > max) return null

    const exact = a * b
    const forbid = new Set<number>()
    if (exact !== answer) forbid.add(exact) // 避免把精确值当成干扰项

    const wrong1 = oppositeTen(a) * b
    const wrong2 = roundToNearestTen(a) * roundToNearestTen(b)
    const minGap = Math.max(20, 10 * b)
    const choices = buildChoices(answer, [wrong1, wrong2], { min: settings.allowNegative ? -max : 0, max }, { forbid, minGap })
    if (!choices) return null

    return { id: crypto.randomUUID(), op, a, b, answer, strategy: 'estimate', choices }
  }

  // add/sub：两个数都凑整到整十，并让准确值接近 10 的倍数
  const a = randInt(min, max)
  const b = randInt(min, max)
  if (a === 1 || b === 1) return null
  const roundedA = roundToNearestTen(a)
  const roundedB = roundToNearestTen(b)

  if (op === 'add') {
    const exact = a + b
    const target = roundToNearestTen(exact)
    if (Math.abs(exact - target) > 3) return null

    const answer = roundedA + roundedB
    if (answer !== target) return null
    if (!inRange(answer, settings.allowNegative ? -max : 0, max)) return null

    const forbid = new Set<number>()
    if (exact !== answer) forbid.add(exact)

    // 常见错误：只凑一个数 / 凑反方向
    const wrong1 = roundedA + b
    const wrong2 = a + roundedB
    const choices = buildChoices(answer, [wrong1, wrong2], { min: settings.allowNegative ? -max : 0, max }, { forbid, minGap: 10 })
    if (!choices) return null

    return { id: crypto.randomUUID(), op, a, b, answer, strategy: 'estimate', choices }
  }

  // sub
  const exact = a - b
  const target = roundToNearestTen(exact)
  if (Math.abs(exact - target) > 3) return null

  const answer = roundedA - roundedB
  if (answer !== target) return null
  if (!settings.allowNegative && answer < 0) return null
  if (!inRange(answer, settings.allowNegative ? -max : 0, max)) return null

  const forbid = new Set<number>()
  if (exact !== answer) forbid.add(exact)

  // 常见错误：只凑一个数
  const wrong1 = roundedA - b
  const wrong2 = a - roundedB
  const choices = buildChoices(answer, [wrong1, wrong2], { min: settings.allowNegative ? -max : 0, max }, { forbid, minGap: 10 })
  if (!choices) return null

  return { id: crypto.randomUUID(), op, a, b, answer, strategy: 'estimate', choices }
}

function roundToNearestTen(n: number) {
  const sign = n < 0 ? -1 : 1
  const x = Math.abs(n)
  const lo = Math.floor(x / 10) * 10
  const hi = lo + 10
  const dLo = x - lo
  const dHi = hi - x
  const r = dHi <= dLo ? hi : lo // tie：进位到上一个整十
  return sign * r
}

function oppositeTen(n: number) {
  const sign = n < 0 ? -1 : 1
  const x = Math.abs(n)
  const lo = Math.floor(x / 10) * 10
  const hi = lo + 10
  const dLo = x - lo
  const dHi = hi - x
  const nearest = dHi <= dLo ? hi : lo
  const opposite = nearest === hi ? lo : hi
  return sign * opposite
}

function inRange(n: number, min: number, max: number) {
  return Number.isFinite(n) && n >= min && n <= max
}

function buildChoices(
  answer: number,
  candidates: number[],
  range: { min: number; max: number },
  opts?: { forbid?: Set<number>; minGap?: number },
) {
  if (!inRange(answer, range.min, range.max)) return null
  const forbid = opts?.forbid ?? new Set<number>()
  const minGap = Math.max(0, Math.floor(opts?.minGap ?? 0))
  const set = new Set<number>()
  set.add(answer)

  function okCandidate(c: number) {
    if (!inRange(c, range.min, range.max)) return false
    if (forbid.has(c)) return false
    if (Math.abs(c - answer) < minGap) return false
    for (const existed of set) {
      if (Math.abs(c - existed) < minGap) return false
    }
    return true
  }

  for (const c of candidates) {
    if (set.size >= 3) break
    if (okCandidate(c)) set.add(c)
  }

  // 兜底：补足到 3 个唯一选项
  const step = minGap > 0 ? minGap : 10
  const fallbacks = [answer + step, answer - step, answer + 2 * step, answer - 2 * step, answer + 3 * step, answer - 3 * step]
  for (const f of fallbacks) {
    if (set.size >= 3) break
    if (okCandidate(f)) set.add(f)
  }

  if (set.size !== 3) return null
  return shuffle(Array.from(set))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randInt(min: number, max: number) {
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

