export function Keypad(props: {
  value: string
  onChange: (next: string) => void
  onBackspace: () => void
  onSubmit: () => void
  disabled?: boolean
}) {
  const disabled = !!props.disabled

  function tap(d: string) {
    if (disabled) return
    props.onChange((props.value + d).slice(0, 6))
  }

  return (
    <div className="keypad" role="group" aria-label="数字键盘">
      <div className="keypadGrid">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} className="keyBtn" onClick={() => tap(d)} disabled={disabled}>
            {d}
          </button>
        ))}
        <button className="keyBtn keyAlt" onClick={() => tap('0')} disabled={disabled}>
          0
        </button>
        <button className="keyBtn keyAlt" onClick={props.onBackspace} disabled={disabled}>
          ⌫
        </button>
        <button className="keyBtn keyPrimary" onClick={props.onSubmit} disabled={disabled}>
          提交
        </button>
      </div>
    </div>
  )
}

