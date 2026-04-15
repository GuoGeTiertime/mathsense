import type { StorageProvider } from '../storage/storageProvider'

export function Stats(props: { storage: StorageProvider; onStart: () => void }) {
  const attempts = props.storage.listAttempts(200)
  const total = attempts.length
  const correct = attempts.filter((a) => a.correct).length
  const avgMs =
    total === 0 ? 0 : Math.round(attempts.reduce((sum, a) => sum + (a.answeredAt - a.startedAt), 0) / total)

  return (
    <div className="stack">
      <div className="card">
        <div className="title">最近记录（本地）</div>
        <div className="statsGrid">
          <div className="stat">
            <div className="statLabel">题目数</div>
            <div className="statValue">{total}</div>
          </div>
          <div className="stat">
            <div className="statLabel">正确率</div>
            <div className="statValue">{total === 0 ? '-' : `${Math.round((correct / total) * 100)}%`}</div>
          </div>
          <div className="stat">
            <div className="statLabel">平均用时</div>
            <div className="statValue">{total === 0 ? '-' : `${Math.round(avgMs / 100) / 10}s`}</div>
          </div>
        </div>
      </div>

      <button className="bigBtn" onClick={props.onStart}>
        开始练习
      </button>
    </div>
  )
}

