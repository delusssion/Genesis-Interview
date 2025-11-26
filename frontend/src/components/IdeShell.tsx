import { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import { checkCode, runCode } from '../shared/api/tasks'

type Language = 'typescript' | 'javascript' | 'python' | 'go' | 'java' | 'cpp' | 'csharp' | 'shell'

const languages: { id: Language; label: string }[] = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'go', label: 'Go' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'shell', label: 'Bash' },
]

const defaultCode: Record<Language, string> = {
  typescript: `function firstUniqueChar(s: string): number {
  const counts = new Map<string, number>()
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1)
  for (let i = 0; i < s.length; i++) if (counts.get(s[i]) === 1) return i
  return -1
}

console.log(firstUniqueChar("leetcode"))`,
  javascript: `function firstUniqueChar(s) {
  const counts = new Map()
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
  java: `public class Main {
    public static int firstUniqueChar(String s) {
        int[] counts = new int[256];
        for (char c : s.toCharArray()) counts[c]++;
        for (int i = 0; i < s.length(); i++) if (counts[s.charAt(i)] == 1) return i;
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(firstUniqueChar("leetcode"));
    }
}`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int firstUniqueChar(const string& s) {
  unordered_map<char,int> cnt;
  for (char c : s) cnt[c]++;
  for (int i = 0; i < (int)s.size(); ++i) if (cnt[s[i]] == 1) return i;
  return -1;
}

int main() {
  cout << firstUniqueChar("leetcode") << "\\n";
  return 0;
}
`,
  csharp: `using System;
using System.Collections.Generic;

class Program {
  static int FirstUniqueChar(string s) {
    var counts = new Dictionary<char, int>();
    foreach (var ch in s) counts[ch] = counts.TryGetValue(ch, out var v) ? v + 1 : 1;
    for (int i = 0; i < s.Length; i++) if (counts[s[i]] == 1) return i;
    return -1;
  }

  static void Main() {
    Console.WriteLine(FirstUniqueChar("leetcode"));
  }
}
`,
  shell: `#!/usr/bin/env bash
# Подсчёт первого уникального символа в строке
first_unique_char() {
  local s="$1"
  declare -A counts
  local i ch
  for (( i=0; i<\${#s}; i++ )); do
    ch="\${s:$i:1}"
    counts["$ch"]=$((counts["$ch"] + 1))
  done
  for (( i=0; i<\${#s}; i++ )); do
    ch="\${s:$i:1}"
    if [[ \${counts["$ch"]} -eq 1 ]]; then
      echo "$i"; return 0
    fi
  done
  echo -1
}

first_unique_char "leetcode"`,
}

type Props = {
  sessionId: number | null
  taskId: string | null
  language?: string
  onProgress?: (data: {
    sessionId: number
    state: string
    quality?: number | null
    testsPassed?: number | null
    testsTotal?: number | null
    feedback?: string
  }) => void
}

type RunResult = {
  type: 'run' | 'check'
  success: boolean
  results?: { test: number; passed: boolean }[]
  details?: string | null
  stderr?: string | null
  hiddenFailed?: boolean
  timeout?: boolean
  limitExceeded?: boolean
}

export function IdeShell({ sessionId, taskId, language: initialLang = 'typescript', onProgress }: Props) {
  const [language, setLanguage] = useState<Language>(initialLang as Language)
  const [code, setCode] = useState(defaultCode['typescript'])
  const [output, setOutput] = useState<string>(
    'Песочница готова: пиши код и запускай тесты, как только интервьюер даст задачу.',
  )
  const [status, setStatus] = useState<'idle' | 'running' | 'checking'>('idle')
  const [duration, setDuration] = useState<number | null>(null)
  const [runResult, setRunResult] = useState<RunResult | null>(null)

  const storageKey = useMemo(() => `ide-draft-${language}`, [language])

  useEffect(() => {
    setLanguage(initialLang as Language)
  }, [initialLang])

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    setCode(saved || defaultCode[language])
  }, [language, storageKey])

  const saveDraft = (next: string) => {
    setCode(next)
    localStorage.setItem(storageKey, next)
  }

  const pushProgress = (data: Partial<RunResult> & { state: string }) => {
    if (!sessionId) return
    const testsPassed =
      data.results?.filter((r) => r.passed).length ??
      (data.hiddenFailed === false ? data.results?.length ?? null : null)
    const testsTotal = data.results?.length ?? null
    const quality = data.success ? (data.type === 'check' ? 95 : 80) : 50
    onProgress?.({
      sessionId,
      state: data.state,
      quality,
      testsPassed,
      testsTotal,
      feedback:
        data.details ||
        (data.success ? 'Тесты пройдены' : data.stderr || 'Есть ошибки, проверь вывод'),
    })
  }

  const handleRun = async () => {
    if (!sessionId || !taskId) {
      setOutput('Нужна сессия и задача для запуска')
      return
    }
    setStatus('running')
    setOutput('Выполняем код...')
    setDuration(null)
    try {
      const res = await runCode({
        session_id: sessionId,
        task_id: taskId,
        language,
        code,
      })
      setDuration(res.time_ms || null)
      setRunResult({
        type: 'run',
        success: res.success,
        results: res.results,
        details: res.details,
        stderr: res.details,
      })
      setOutput(res.results ? JSON.stringify(res.results, null, 2) : res.success ? 'ok' : 'Ошибка запуска')
      pushProgress({
        type: 'run',
        success: res.success,
        results: res.results,
        details: res.details || undefined,
        state: res.state || 'awaiting_solution',
      })
    } catch (e) {
      setOutput((e as Error).message)
    } finally {
      setStatus('idle')
    }
  }

  const handleCheck = async () => {
    if (!sessionId || !taskId) {
      setOutput('Нужна сессия и задача для проверки')
      return
    }
    setStatus('checking')
    setOutput('Гоняем тесты...')
    setDuration(null)
    try {
      const res = await checkCode({
        session_id: sessionId,
        task_id: taskId,
        language,
        code,
      })
      setDuration(res.time_ms || null)
      setRunResult({
        type: 'check',
        success: res.success,
        details: res.details,
        hiddenFailed: res.hidden_failed,
        timeout: res.timeout,
        limitExceeded: res.limit_exceeded,
      })
      setOutput(res.details || (res.success ? 'Скрытые тесты пройдены' : 'Ошибки в скрытых тестах'))
      pushProgress({
        type: 'check',
        success: res.success,
        details: res.details || undefined,
        hiddenFailed: res.hidden_failed,
        timeout: res.timeout,
        limitExceeded: res.limit_exceeded,
        state: res.state || 'feedback_ready',
      })
    } catch (e) {
      setOutput((e as Error).message)
    } finally {
      setStatus('idle')
    }
  }

  return (
    <div className="panel runner-panel">
      <div className="runner-head">
        <div>
          <p className="eyebrow">Кодовая песочница</p>
          <h3>Раннер кода</h3>
        </div>
        <span className="muted small">
          {status === 'running' ? 'Запуск' : status === 'checking' ? 'Проверка тестов' : 'Готово'}
        </span>
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
            {status === 'running' ? 'Запуск...' : 'Запустить'}
          </button>
          <button className="cta" type="button" onClick={handleCheck} disabled={status !== 'idle'}>
            {status === 'checking' ? 'Тесты...' : 'Прогнать тесты'}
          </button>
        </div>
      </div>

      <div className="ide-body">
        <div className="editor">
          <Editor
            height="340px"
            language={language === 'typescript' ? 'typescript' : language}
            value={code}
            onChange={(value) => saveDraft(value || '')}
            theme="vs"
            options={{ minimap: { enabled: false }, readOnly: status !== 'idle', fontSize: 14 }}
          />
        </div>
        <div className="runner-output">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Вывод</p>
              {duration !== null && <p className="muted">Время: {duration} мс</p>}
            </div>
          </div>
          {runResult?.stderr && <p className="muted">stderr: {runResult.stderr}</p>}
          <pre>{output}</pre>
          {runResult && (
            <div className="visible-tests-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Видимые тесты</p>
                  <p className="muted">Результаты последних прогонов</p>
                </div>
              </div>
              <div className="tests-grid">
                {runResult.results?.map((res) => (
                  <div key={res.test} className="test-card">
                    <div className="test-top">
                      <span className="pill pill-ghost">Тест {res.test}</span>
                      <span className={`status ${res.passed ? 'status-passed' : 'status-failed'}`}>
                        {res.passed ? '✓' : '✕'}
                      </span>
                    </div>
                  </div>
                ))}
                {runResult.type === 'check' && runResult.hiddenFailed !== undefined && (
                  <div className="test-card">
                    <div className="test-top">
                      <span className="pill pill-ghost">Скрытые</span>
                      <span
                        className={`status ${
                          runResult.hiddenFailed ? 'status-failed' : 'status-passed'
                        }`}
                      >
                        {runResult.hiddenFailed ? '✕' : '✓'}
                      </span>
                    </div>
                    {runResult.limitExceeded && <p className="muted">Лимит ресурсов</p>}
                    {runResult.timeout && <p className="muted">Таймаут</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
