import { useRef, useState } from 'react'

export function useAction() {
  const running = useRef(false)
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const run = async (action: () => Promise<void>, success = '') => {
    if (running.current) return
    running.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      setNotice(success)
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Não foi possível concluir a ação.',
      )
    } finally {
      running.current = false
      setBusy(false)
    }
  }
  return { run, busy, error, notice, setError }
}
