import type { StorageProvider } from '../storage/storageProvider'
import { formatOp } from '../shared/ui/format'

export function WrongBook(props: { storage: StorageProvider; onStartWrong: () => void }) {
  const attempts = props.storage.listAttempts(500).filter((a) => !a.correct).slice(-50).reverse()

  return (
    <div className="stack">
      <div className="card">
        <div className="title">错题本（简化版）</div>
        <div className="muted">先把“做错的题”展示出来；后续再做去重、重练、策略归类。</div>
      </div>

      {attempts.length === 0 ? (
        <div className="card muted">暂无错题</div>
      ) : (
        <div className="card attemptList">
          {attempts.map((a) => (
            <div key={a.id} className="attemptRow">
              <div className="attemptQ">
                {a.question.a} {formatOp(a.question.op)} {a.question.b} = {a.question.answer}
              </div>
              <div className="bad">你答：{a.userAnswer}</div>
            </div>
          ))}
        </div>
      )}

      <button className="bigBtn" onClick={props.onStartWrong}>
        去练习
      </button>
    </div>
  )
}

