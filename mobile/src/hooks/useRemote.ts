import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'

export function useRemote<T>(path: string, refreshKey = 0) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api<T>(path))
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Não foi possível carregar os dados.',
      )
    } finally {
      setLoading(false)
    }
  }, [path])
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setData(null)
    api<T>(path)
      .then((result) => {
        if (active) setData(result)
      })
      .catch((problem) => {
        if (active)
          setError(
            problem instanceof Error
              ? problem.message
              : 'Não foi possível carregar os dados.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [path, refreshKey])
  return { data, error, loading, reload, setData }
}
