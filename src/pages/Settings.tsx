import type { AppSettings, Op } from '../shared/types'

export function Settings(props: { settings: AppSettings; onChange: (next: AppSettings) => void }) {
  const s = props.settings

  function toggleOp(op: Op) {
    const has = s.ops.includes(op)
    const ops = has ? s.ops.filter((x) => x !== op) : [...s.ops, op]
    props.onChange({ ...s, ops: ops.length === 0 ? ['add'] : ops })
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="title">练习设置</div>
        <div className="muted">第一版先做“直接计算”；策略训练会在下一步加入。</div>
      </div>

      <div className="card form">
        <label className="field">
          <div className="fieldLabel">最大数值（≤100）</div>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={10}
            max={100}
            value={s.rangeMax}
            onChange={(e) => props.onChange({ ...s, rangeMax: clampInt(e.target.value, 10, 100) })}
          />
        </label>

        <label className="field">
          <div className="fieldLabel">每轮题数</div>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={5}
            max={50}
            value={s.questionsPerRound}
            onChange={(e) => props.onChange({ ...s, questionsPerRound: clampInt(e.target.value, 5, 50) })}
          />
        </label>

        <label className="fieldRow">
          <input
            type="checkbox"
            checked={s.allowZero}
            onChange={(e) => props.onChange({ ...s, allowZero: e.target.checked })}
          />
          <span>允许出现 0</span>
        </label>

        <label className="fieldRow">
          <input
            type="checkbox"
            checked={s.requireIntegerDivision}
            onChange={(e) => props.onChange({ ...s, requireIntegerDivision: e.target.checked })}
          />
          <span>除法要求整除</span>
        </label>
      </div>

      <div className="card">
        <div className="fieldLabel">运算选择</div>
        <div className="chips">
          <button className={chipClass(s.ops.includes('add'))} onClick={() => toggleOp('add')}>
            加法
          </button>
          <button className={chipClass(s.ops.includes('sub'))} onClick={() => toggleOp('sub')}>
            减法
          </button>
          <button className={chipClass(s.ops.includes('mul'))} onClick={() => toggleOp('mul')}>
            乘法
          </button>
          <button className={chipClass(s.ops.includes('div'))} onClick={() => toggleOp('div')}>
            除法
          </button>
        </div>
      </div>
    </div>
  )
}

function clampInt(v: string, min: number, max: number) {
  const n = Math.floor(Number(v))
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

function chipClass(active: boolean) {
  return active ? 'chip chipActive' : 'chip'
}

