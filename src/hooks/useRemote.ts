import { useState, useRef, useCallback, useEffect } from 'react'
import { api } from '../services/api'
import { message } from '../utils/errors'

export function useRemote<T>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const pending = useRef<AbortController | null>(null)
  const reload = useCallback(async () => {
    pending.current?.abort()
    const controller = new AbortController()
    pending.current = controller
    setLoading(true)
    setError('')
    try {
      const result = await api<T>(path, { signal: controller.signal })
      if (!controller.signal.aborted) setData(result)
    } catch (e) {
      if (
        !controller.signal.aborted &&
        !(e instanceof DOMException && e.name === 'AbortError')
      )
        setError(message(e))
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [path])
  useEffect(() => {
    void reload()
    return () => pending.current?.abort()
  }, [reload])
  return { data, error, loading, reload }
}
