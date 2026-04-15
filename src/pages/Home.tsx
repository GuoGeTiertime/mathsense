export function Home(props: {
  onStartDirect: () => void
  onStartMakeTarget: () => void
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

