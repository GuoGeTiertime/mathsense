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
    setFeedback('idle')
    setAttempts([])
  }, [props.settings, props.mode, props.createQuestion])

  useEffect(() => {
    if (feedback !== 'idle') return
    const v = input.trim()
    if (!v) return
    const n = Number(v)
    if (!Number.isFinite(n)) return
    if (n === question.answer) doSubmit()
  }, [input, feedback, question.answer])

  const progressText = useMemo(() => `${index + 1} / ${total}`, [index, total])

  function next() {
    setIndex((v) => v + 1)
    setQuestion(props.createQuestion())
    setInput('')
    setFeedback('idle')
  }

  function doSubmit() {
    if (feedback === 'correct') return
    if (!input.trim()) return

    const userAnswer = Number(input)
    if (!Number.isFinite(userAnswer)) return

    const answeredAt = Date.now()
    const correct = userAnswer === question.answer

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
          <span className="qNum">{question.a}</span>
          <span className="qOp">{formatOp(question.op)}</span>
          <span className="qNum">{question.b}</span>
          <span className="qEq">=</span>
          <span className="qAns">{input || '？'}</span>
        </div>
      </div>

      <div className="card">
        <div className="inputPreview">
          <div className="inputLabel">你的答案</div>
          <div className="inputValue">{input || '（未输入）'}</div>
        </div>
      </div>

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

