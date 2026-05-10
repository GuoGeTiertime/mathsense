import type { LifetimeTotals } from '../storage/storageProvider'
import type { SessionResult } from '../shared/types'

export function Result(props: {
  result: SessionResult
  lifetime: LifetimeTotals
  onRetry: () => void
  onHome: () => void
}) {
  const { result, lifetime } = props
  const wrong = Math.max(0, result.total - result.correct)
  const sessionRate =
    result.total === 0 ? '—' : `${Math.round((result.correct / result.total) * 100)}%`
  const lifetimeRate =
    lifetime.questions === 0 ? '—' : `${Math.round((lifetime.correct / lifetime.questions) * 100)}%`

  return (
    <div className="stack">
      <div className="card">
        <div className="title">完成！</div>
        <div className="statsGrid">
          <div className="stat">
            <div className="statLabel">本组正确</div>
            <div className="statValue">{result.correct}</div>
          </div>
          <div className="stat">
            <div className="statLabel">本组错误</div>
            <div className="statValue">{wrong}</div>
          </div>
          <div className="stat">
            <div className="statLabel">本组题数</div>
            <div className="statValue">{result.total}</div>
          </div>
          <div className="stat">
            <div className="statLabel">本组正确率</div>
            <div className="statValue">{sessionRate}</div>
          </div>
          <div className="stat">
            <div className="statLabel">累计做题</div>
            <div className="statValue">{lifetime.questions}</div>
          </div>
          <div className="stat">
            <div className="statLabel">累计正确率</div>
            <div className="statValue">{lifetimeRate}</div>
          </div>
        </div>
        <div className="muted resultAvgNote">
          平均用时：{result.total === 0 ? '—' : `${Math.round(result.avgMs / 100) / 10}s`}
        </div>
      </div>

      <div className="row">
        <button className="bigBtn" onClick={props.onRetry}>
          再来一组
        </button>
        <button className="ghostBtn" onClick={props.onHome}>
          回首页
        </button>
      </div>

      <details className="card">
        <summary className="summary">查看本轮题目</summary>
        <div className="attemptList">
          {result.attempts.map((a) => (
            <div key={a.id} className="attemptRow">
              <div className="attemptQ">
                {formatAttemptQuestion(a.question)}
              </div>
              <div className={a.correct ? 'ok' : 'bad'}>你答：{a.userAnswer}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}

function op(x: SessionResult['attempts'][number]['question']['op']) {
  switch (x) {
    case 'add':
      return '+'
    case 'sub':
      return '−'
    case 'mul':
      return '×'
    case 'div':
      return '÷'
  }
}

function formatAttemptQuestion(q: SessionResult['attempts'][number]['question']) {
  if (q.strategy === 'makeSumTarget') {
    // 补数：a + (答案) = 目标(b)
    return `${q.a} + (${q.answer}) = ${q.b}`
  }
  return `${q.a} ${op(q.op)} ${q.b} = ${q.answer}`
}

