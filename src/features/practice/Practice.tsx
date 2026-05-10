import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppSettings, AttemptRecord, PracticeMode, Question, SessionResult } from '../../shared/types'
import type { StorageProvider } from '../../storage/storageProvider'
import { Keypad } from '../../shared/ui/Keypad'
import { formatOp } from '../../shared/ui/format'

export function Practice(props: {
  mode: PracticeMode
  settings: AppSettings
  storage: StorageProvider
  createQuestion: () => Question
  onFinish: (result: SessionResult) => void
}) {
  const total = Math.max(1, Math.floor(props.settings.questionsPerRound))
  const correctAdvanceDelayMs = 80

  const [index, setIndex] = useState(0)
  const [question, setQuestion] = useState<Question>(() => props.createQuestion())
  const [input, setInput] = useState('')
  const [makeStep, setMakeStep] = useState<0 | 1 | 2>(0)
  const [makeX, setMakeX] = useState('')
  const [makeY, setMakeY] = useState('')
  const [makeResult, setMakeResult] = useState('')
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [attempts, setAttempts] = useState<AttemptRecord[]>([])

  const startedAtRef = useRef<number>(Date.now())
  const sessionIdRef = useRef<string>(crypto.randomUUID())

  useEffect(() => {
    startedAtRef.current = Date.now()
    sessionIdRef.current = crypto.randomUUID()
    setIndex(0)
    setQuestion(props.createQuestion())
    setInput('')
    setMakeStep(0)
    setMakeX('')
    setMakeY('')
    setMakeResult('')
    setFeedback('idle')
    setAttempts([])
  }, [props.settings, props.mode, props.createQuestion])

  useEffect(() => {
    setMakeStep(0)
    setMakeX('')
    setMakeY('')
    setMakeResult('')
    setInput('')
    setFeedback('idle')
  }, [question.id])

  useEffect(() => {
    if (feedback !== 'idle') return
    const v = input.trim()
    if (!v) return
    const n = Number(v)
    if (!Number.isFinite(n)) return
    if (question.strategy === 'estimate') return
    if (question.strategy === 'makeTarget') {
      const expected = currentExpectedMakeValue()
      if (typeof expected === 'number' && n === expected) doSubmit()
      return
    }
    if (n === question.answer) doSubmit()
  }, [input, feedback, makeStep, question.answer, question.expectedSteps, question.strategy])

  const progressText = useMemo(() => `${index + 1} / ${total}`, [index, total])
  const eqText = question.strategy === 'estimate' ? '≈' : '='

  function next() {
    setIndex((v) => v + 1)
    setQuestion(props.createQuestion())
    setInput('')
    setMakeStep(0)
    setMakeX('')
    setMakeY('')
    setMakeResult('')
    setFeedback('idle')
  }

  function currentExpectedMakeValue(): number | null {
    const steps = question.expectedSteps
    if (!steps) return null
    if (makeStep === 0) return steps.x
    if (makeStep === 1) return steps.y
    return steps.result
  }

  function goNextMakeStep(filled: string) {
    if (makeStep === 0) setMakeX(filled)
    else if (makeStep === 1) setMakeY(filled)
    else setMakeResult(filled)

    if (makeStep < 2) {
      setMakeStep((s) => (s + 1) as 0 | 1 | 2)
      setInput('')
      return
    }
  }

  function doSubmit(overrideAnswer?: number) {
    if (feedback === 'correct') return
    if (overrideAnswer === undefined && !input.trim()) return

    const userAnswer = overrideAnswer ?? Number(input)
    if (!Number.isFinite(userAnswer)) return

    const answeredAt = Date.now()
    let correct = false
    if (question.strategy === 'makeTarget') {
      const expected = currentExpectedMakeValue()
      if (typeof expected === 'number') correct = userAnswer === expected
    } else {
      correct = userAnswer === question.answer
    }

    if (question.strategy === 'makeTarget') {
      if (!correct) {
        setFeedback('wrong')
        setInput('')
        return
      }
      const filled = input.trim()
      goNextMakeStep(filled)
      if (makeStep < 2) return

      // step 2 完成：记录一次作答并进入下一题（避免递归调用 doSubmit）
      const attempt: AttemptRecord = {
        id: crypto.randomUUID(),
        question,
        userAnswer,
        correct: true,
        startedAt: startedAtRef.current,
        answeredAt,
      }

      props.storage.appendAttempt(attempt)
      setAttempts((prev) => [...prev, attempt])
      setFeedback('correct')

      const isLast = index + 1 >= total
      window.setTimeout(() => {
        if (isLast) {
          const result = buildResult(sessionIdRef.current, [...attempts, attempt])
          props.onFinish(result)
        } else {
          startedAtRef.current = Date.now()
          next()
        }
      }, correctAdvanceDelayMs)
      return
    }

    const attempt: AttemptRecord = {
      id: crypto.randomUUID(),
      question,
      userAnswer,
      correct,
      startedAt: startedAtRef.current,
      answeredAt,
    }

    props.storage.appendAttempt(attempt)
    setAttempts((prev) => [...prev, attempt])
    setFeedback(correct ? 'correct' : 'wrong')

    if (!correct) {
      setInput('')
      return
    }

    const isLast = index + 1 >= total
    window.setTimeout(() => {
      if (isLast) {
        const result = buildResult(sessionIdRef.current, [...attempts, attempt])
        props.onFinish(result)
      } else {
        startedAtRef.current = Date.now()
        next()
      }
    }, correctAdvanceDelayMs)
  }

  return (
    <div className="practice">
      <div className="row between">
        <div className="pill">第 {progressText} 题</div>
        <div className="pill">{feedback === 'idle' ? '作答中' : feedback === 'correct' ? '正确' : '再想想'}</div>
      </div>

      <div className={feedback === 'wrong' ? 'card questionCard questionCardWrong' : 'card questionCard'}>
        <div className="questionText" aria-live="polite">
          {question.strategy === 'makeTarget' ? (
            <>
              <span className="qNum">{question.a}</span>
              <span className="qOp">+</span>
              <span className="qNum">{question.b}</span>
              <span className="qEq">=</span>

              {makeStep === 0 ? (
                <>
                  <span className="qNum">(</span>
                  <span className="qNum">{question.a}</span>
                  <span className="qOp">+</span>
                  <span className="qAns">{input || 'x'}</span>
                  <span className="qNum">)</span>
                  <span className="qOp">+</span>
                  <span className="qNum">y</span>
                </>
              ) : makeStep === 1 ? (
                <>
                  <span className="qNum">{question.a}</span>
                  <span className="qOp">+</span>
                  <span className="qNum">(</span>
                  <span className="qNum">{makeX || 'x'}</span>
                  <span className="qOp">+</span>
                  <span className="qAns">{input || 'y'}</span>
                  <span className="qNum">)</span>
                </>
              ) : (
                <>
                  <span className="qNum">(</span>
                  <span className="qNum">{question.a}</span>
                  <span className="qOp">+</span>
                  <span className="qNum">{makeX || 'x'}</span>
                  <span className="qNum">)</span>
                  <span className="qOp">+</span>
                  <span className="qNum">{makeY || 'y'}</span>
                </>
              )}
            </>
          ) : question.strategy === 'makeSumTarget' ? (
            <>
              <span className="qNum">{question.a}</span>
              <span className="qOp">+</span>
              <span className="qAns">{input || '□'}</span>
              <span className="qEq">{eqText}</span>
              <span className="qNum">{question.b}</span>
            </>
          ) : (
            <>
              <span className="qNum">{question.a}</span>
              <span className="qOp">{formatOp(question.op)}</span>
              <span className="qNum">{question.b}</span>
              <span className="qEq">{eqText}</span>
              <span className="qAns">{input || '？'}</span>
            </>
          )}
        </div>
      </div>

      {question.strategy === 'makeTarget' && (
        <div className="card">
          <div className="stack">
            <div className="fieldLabel">凑数步骤（按顺序输入）</div>
            <div className={makeStep === 0 ? 'inputPreview stepCurrent' : 'inputPreview'}>
              <div className="inputLabel">
                ① 凑到 {question.strategyTarget}：{question.a} + X = {question.strategyTarget} {makeStep === 0 ? '（当前）' : ''}
              </div>
              <div className="inputValue">X = {makeStep === 0 ? input || '？' : makeX || '？'}</div>
            </div>
            <div className={makeStep === 1 ? 'inputPreview stepCurrent' : 'inputPreview'}>
              <div className="inputLabel">
                ② 分解加数：{question.b} = X + Y {makeStep === 1 ? '（当前）' : ''}
              </div>
              <div className="inputValue">Y = {makeStep === 1 ? input || '？' : makeY || '？'}</div>
            </div>
            <div className={makeStep === 2 ? 'inputPreview stepCurrent' : 'inputPreview'}>
              <div className="inputLabel">
                ③ 最终结果：{question.a} + {question.b} = ? {makeStep === 2 ? '（当前）' : ''}
              </div>
              <div className="inputValue">结果 = {makeStep === 2 ? input || '？' : makeResult || '？'}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="inputPreview">
          <div className="inputLabel">你的答案</div>
          <div className="inputValue">{input || '（未输入）'}</div>
        </div>
      </div>

      {question.strategy === 'estimate' && question.choices?.length === 3 ? (
        <div className="stack">
          {question.choices.map((c) => (
            <button
              key={c}
              className="bigBtn"
              disabled={feedback === 'correct'}
              onClick={() => {
                setInput(String(c))
                if (feedback === 'wrong') setFeedback('idle')
                doSubmit(c)
              }}
            >
              {c}
            </button>
          ))}
        </div>
      ) : (
        <Keypad
          value={input}
          onChange={(v) => {
            setInput(v)
            if (feedback === 'wrong') setFeedback('idle')
          }}
          onBackspace={() => {
            setInput((v) => v.slice(0, -1))
            if (feedback === 'wrong') setFeedback('idle')
          }}
          onSubmit={doSubmit}
          disabled={feedback === 'correct'}
        />
      )}
    </div>
  )
}

function buildResult(sessionId: string, attempts: AttemptRecord[]): SessionResult {
  const total = attempts.length
  const correct = attempts.filter((a) => a.correct).length
  const avgMs =
    total === 0 ? 0 : Math.round(attempts.reduce((sum, a) => sum + (a.answeredAt - a.startedAt), 0) / total)
  return { sessionId, total, correct, avgMs, attempts }
}

