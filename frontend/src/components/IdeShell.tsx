import { useEffect, useState } from 'react'
import { checkMock, languages, runMock, type Language } from '../shared/api/ideMock'

const defaultCode: Record<Language, string> = {
  typescript: `function firstUniqueChar(s: string): number {
  const counts = new Map<string, number>()
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1)
  for (let i = 0; i < s.length; i++) if (counts.get(s[i]) === 1) return i
  return -1
}

console.log(firstUniqueChar("leetcode"))`,
  python: `def first_unique_char(s: str) -> int:
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    for i, ch in enumerate(s):
        if counts[ch] == 1:
            return i
    return -1

print(first_unique_char("leetcode"))`,
  go: `package main

import "fmt"

func firstUniqueChar(s string) int {
  counts := make(map[rune]int)
  for _, ch := range s { counts[ch]++ }
  for i, ch := range s { if counts[ch] == 1 { return i } }
  return -1
}

func main() { fmt.Println(firstUniqueChar("leetcode")) }`,
}

export function IdeShell() {
  const [language, setLanguage] = useState<Language>('typescript')
  const [code, setCode] = useState(defaultCode['typescript'])
  const [output, setOutput] = useState<string>('Готов к запуску.')
  const [status, setStatus] = useState<'idle' | 'running' | 'checking'>('idle')
  const [duration, setDuration] = useState<number | null>(null)

  useEffect(() => {
    setCode(defaultCode[language])
  }, [language])

  const handleRun = async () => {
    setStatus('running')
    setOutput('Выполняем код...')
    setDuration(null)
    const res = await runMock(code, language)
    setStatus('idle')
    setDuration(res.durationMs)
    setOutput(res.stderr ? res.stderr : res.stdout)
  }

  const handleCheck = async () => {
    setStatus('checking')
    setOutput('Гоняем тесты...')
    setDuration(null)
    const res = await checkMock(code)
    setStatus('idle')
    setDuration(res.durationMs)
    setOutput(res.stderr ? res.stderr : res.stdout)
  }

  const statusLabel =
    status === 'running' ? 'Запуск' : status === 'checking' ? 'Проверка тестов' : 'Готов'

  return (
    <div className="panel grid-full">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Шаг 5 · IDE</p>
          <h2>Редактор и мок раннера</h2>
          <p className="muted">
            Выберите язык, редактируйте код, запускайте Run/Check. Ответы моковые, имитируют
            stdout/ошибки. Дальше подключим бэковый раннер.
          </p>
        </div>
        <div className="pill pill-ghost">{statusLabel}</div>
      </div>

      <div className="ide-toolbar">
        <div className="lang-picker">
          <label>Язык</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            disabled={status !== 'idle'}
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <div className="actions">
          <button className="ghost-btn" type="button" onClick={handleRun} disabled={status !== 'idle'}>
            {status === 'running' ? 'Запуск...' : 'Run'}
          </button>
          <button className="cta" type="button" onClick={handleCheck} disabled={status !== 'idle'}>
            {status === 'checking' ? 'Тесты...' : 'Check'}
          </button>
        </div>
      </div>

      <div className="ide-body">
        <div className="editor">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            disabled={status !== 'idle'}
          />
        </div>
        <div className="runner-output">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Вывод</p>
              {duration !== null && <p className="muted">Время: {duration} мс</p>}
            </div>
          </div>
          <pre>{output}</pre>
        </div>
      </div>
    </div>
  )
}
