export function Home(props: {
  onStartDirect: () => void
  onStartMakeTarget: () => void
  onStartEstimate: () => void
  onStartMakeSumTarget: () => void
  onStartMixed: () => void
  onStats: () => void
  onWrongBook: () => void
  onSettings: () => void
}) {
  return (
    <div className="stack">
      <div className="card">
        <div className="title">适合手机操作的百以内四则训练</div>
        <div className="muted">先做最小闭环：直接计算 + 统计（本地保存）。</div>
      </div>

      <button className="bigBtn" onClick={props.onStartDirect}>
        开始：直接计算
      </button>

      <button className="bigBtn" onClick={props.onStartMakeTarget}>
        开始：凑数练习（凑10/20/100）
      </button>

      <button className="bigBtn" onClick={props.onStartEstimate}>
        开始：估算练习（三选一）
      </button>

      <button className="bigBtn" onClick={props.onStartMakeSumTarget}>
        开始：补数练习（凑10/20/50/100）
      </button>

      <button className="bigBtn" onClick={props.onStartMixed}>
        开始：混合练习（全部题型）
      </button>

      <div className="row">
        <button className="ghostBtn" onClick={props.onStats}>
          统计
        </button>
        <button className="ghostBtn" onClick={props.onWrongBook}>
          错题本
        </button>
        <button className="ghostBtn" onClick={props.onSettings}>
          设置
        </button>
      </div>
    </div>
  )
}

