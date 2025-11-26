export type AntiCheatType =
  | 'copy'
  | 'paste'
  | 'blur'
  | 'focus'
  | 'visibility-hidden'
  | 'visibility-visible'
  | 'devtools'

export type AntiCheatSignal = {
  id: string
  type: AntiCheatType
  at: string
  meta?: string
}

const genId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`

const emit = (type: AntiCheatType, meta?: string): AntiCheatSignal => ({
  id: genId('ac'),
  type,
  at: new Date().toISOString(),
  meta,
})

export function startAntiCheat(onSignal: (signal: AntiCheatSignal) => void): () => void {
  const handleCopy = () => onSignal(emit('copy'))
  const handlePaste = () => onSignal(emit('paste'))
  const handleBlur = () => onSignal(emit('blur'))
  const handleFocus = () => onSignal(emit('focus'))
  const handleVisibility = () =>
    onSignal(
      emit(document.visibilityState === 'hidden' ? 'visibility-hidden' : 'visibility-visible'),
    )

  let devtoolsOpen = false
  const devtoolsInterval = setInterval(() => {
    const threshold = 160
    const widthDiff = Math.abs(window.outerWidth - window.innerWidth)
    const heightDiff = Math.abs(window.outerHeight - window.innerHeight)
    const detected = widthDiff > threshold || heightDiff > threshold
    if (detected && !devtoolsOpen) {
      devtoolsOpen = true
      onSignal(emit('devtools', 'auto-detected'))
    }
    if (!detected && devtoolsOpen) {
      devtoolsOpen = false
    }
  }, 1200)

  window.addEventListener('copy', handleCopy)
  window.addEventListener('paste', handlePaste)
  window.addEventListener('blur', handleBlur)
  window.addEventListener('focus', handleFocus)
  document.addEventListener('visibilitychange', handleVisibility)

  return () => {
    clearInterval(devtoolsInterval)
    window.removeEventListener('copy', handleCopy)
    window.removeEventListener('paste', handlePaste)
    window.removeEventListener('blur', handleBlur)
    window.removeEventListener('focus', handleFocus)
    document.removeEventListener('visibilitychange', handleVisibility)
  }
}

export function triggerDevtools(onSignal: (signal: AntiCheatSignal) => void) {
  onSignal(emit('devtools', 'manual-trigger'))
}
