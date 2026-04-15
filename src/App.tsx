import { useMemo, useState } from 'react'
import { createQuestion } from './features/generator/createQuestion'
import { Practice } from './features/practice/Practice'
import { Result } from './pages/Result'
import { Home } from './pages/Home'
import { Settings } from './pages/Settings'
import { Stats } from './pages/Stats'
import { WrongBook } from './pages/WrongBook'
import { LocalStorageProvider } from './storage/localStorageProvider'
import type { AppSettings, PracticeMode, SessionResult } from './shared/types'

const storage = new LocalStorageProvider()

type View =
  | { name: 'home' }
  | { name: 'practice'; mode: PracticeMode }
  | { name: 'result'; result: SessionResult }
  | { name: 'stats' }
  | { name: 'wrongBook' }
  | { name: 'settings' }

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() => storage.loadSettings() ?? defaultSettings)
  const [view, setView] = useState<View>({ name: 'home' })

  const header = useMemo(() => {
    const title =
      view.name === 'home'
        ? '数感训练'
        : view.name === 'practice'
          ? view.mode === 'direct'
            ? '直接计算'
            : '策略训练'
          : view.name === 'result'
            ? '本轮结果'
            : view.name === 'stats'
              ? '统计'
              : view.name === 'wrongBook'
                ? '错题本'
                : '设置'
    return title
  }, [view])

  return (
    <div className="appShell">
      <header className="topBar">
        <div className="topBarTitle">{header}</div>
        <div className="topBarActions">
          {view.name !== 'home' && (
            <button className="linkBtn" onClick={() => setView({ name: 'home' })}>
              返回
            </button>
          )}
        </div>
      </header>

      <main className="page">
        {view.name === 'home' && (
          <Home
            onStartDirect={() => setView({ name: 'practice', mode: 'direct' })}
            onStats={() => setView({ name: 'stats' })}
            onWrongBook={() => setView({ name: 'wrongBook' })}
            onSettings={() => setView({ name: 'settings' })}
          />
        )}

        {view.name === 'practice' && (
          <Practice
            mode={view.mode}
            settings={settings}
            storage={storage}
            createQuestion={() => createQuestion(settings)}
            onFinish={(result) => setView({ name: 'result', result })}
          />
        )}

        {view.name === 'result' && (
          <Result
            result={view.result}
            onRetry={() => setView({ name: 'practice', mode: 'direct' })}
            onHome={() => setView({ name: 'home' })}
          />
        )}

        {view.name === 'stats' && <Stats storage={storage} onStart={() => setView({ name: 'practice', mode: 'direct' })} />}
        {view.name === 'wrongBook' && <WrongBook storage={storage} onStartWrong={() => setView({ name: 'practice', mode: 'direct' })} />}
        {view.name === 'settings' && (
          <Settings
            settings={settings}
            onChange={(next) => {
              setSettings(next)
              storage.saveSettings(next)
            }}
          />
        )}
      </main>
    </div>
  )
}

const defaultSettings: AppSettings = {
  rangeMax: 100,
  allowZero: true,
  allowNegative: false,
  requireIntegerDivision: true,
  ops: ['add', 'sub', 'mul', 'div'],
  questionsPerRound: 10,
}

