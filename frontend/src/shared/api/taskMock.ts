export type VisibleTestCase = {
  id: string
  name: string
  input: string
  expected: string
  status: 'pending' | 'passed' | 'failed'
}

export type TaskPayload = {
  id: string
  title: string
  description: string
  constraints: string[]
  visibleTests: VisibleTestCase[]
  language: string
  level: 'Junior' | 'Middle' | 'Senior'
}

export type TaskState =
  | 'idle'
  | 'task_issued'
  | 'awaiting_solution'
  | 'evaluating'
  | 'feedback_ready'

const mockTask: TaskPayload = {
  id: 'task-1',
  title: 'Найти первый уникальный символ в строке',
  description:
    'Дана строка s. Нужно вернуть индекс первого символа, который встречается ровно один раз. Если такого символа нет — вернуть -1. Строка может содержать только латинские буквы.',
  constraints: [
    'Сложность: O(n)',
    'Память: O(1) доп. структуры (функции языка считаются)',
    'Учитывать регистр символов',
  ],
  visibleTests: [
    {
      id: 't1',
      name: 'Базовый',
      input: '"leetcode"',
      expected: '0',
      status: 'pending',
    },
    {
      id: 't2',
      name: 'Повторы',
      input: '"aabb"',
      expected: '-1',
      status: 'pending',
    },
    {
      id: 't3',
      name: 'Середина',
      input: '"aabccdbee"',
      expected: '6',
      status: 'pending',
    },
  ],
  language: 'typescript',
  level: 'Middle',
}

export function fetchMockTask(): Promise<TaskPayload> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockTask), 300)
  })
}

export function evaluateMockTask(): Promise<VisibleTestCase[]> {
  const statuses: VisibleTestCase[] = mockTask.visibleTests.map((test, idx) => ({
    ...test,
    status: idx === 1 ? 'failed' : 'passed',
  }))

  return new Promise((resolve) => {
    setTimeout(() => resolve(statuses), 700)
  })
}
