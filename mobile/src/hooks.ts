import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

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
export function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const run = async (action: () => Promise<void>, success = '') => {
    if (busy) return
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
      setBusy(false)
    }
  }
  return { run, busy, error, notice, setError }
}
export function money(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
export function datetime(value: string) {
  return new Date(value).toLocaleString('pt-BR')
}
