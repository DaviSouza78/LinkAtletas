import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { api } from '../services/api'

export function useRemote<T>(path: string, refreshKey = 0) {
  const request = useRef(0),
    mounted = useRef(false)
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    const current = ++request.current
    setLoading(true)
    setError('')
    try {
      const result = await api<T>(path)
      if (mounted.current && request.current === current) setData(result)
    } catch (problem) {
      if (mounted.current && request.current === current)
        setError(
          problem instanceof Error
            ? problem.message
            : 'Não foi possível carregar os dados.',
        )
    } finally {
      if (mounted.current && request.current === current) setLoading(false)
    }
  }, [path])
  useEffect(() => {
    mounted.current = true
    const current = ++request.current
    setLoading(true)
    setError('')
    setData(null)
    api<T>(path)
      .then((result) => {
        if (mounted.current && current === request.current) setData(result)
      })
      .catch((problem) => {
        if (mounted.current && current === request.current)
          setError(
            problem instanceof Error
              ? problem.message
              : 'Não foi possível carregar os dados.',
          )
      })
      .finally(() => {
        if (mounted.current && current === request.current) setLoading(false)
      })
    return () => {
      mounted.current = false
      request.current++
    }
  }, [path, refreshKey])
  useEffect(() => {
    const refreshable =
      /^\/(dashboard|contracts|workouts|notifications|consultations|reviews|admin\/verifications|admin\/reviews|admin\/privacy\/requests)(\?|$)|^\/contracts\/[^/]+\/messages/.test(
        path,
      )
    if (!refreshable) return
    let pending = false,
      active = true
    const refresh = async () => {
      if (!active || pending || AppState.currentState !== 'active') return
      pending = true
      const current = ++request.current
      try {
        const result = await api<T>(path)
        if (active && mounted.current && current === request.current) {
          setData(result)
          setError('')
          setLoading(false)
        }
      } catch (problem) {
        if (active && mounted.current && current === request.current) {
          setError(
            problem instanceof Error
              ? problem.message
              : 'Nao foi possivel atualizar os dados.',
          )
          setLoading(false)
        }
      } finally {
        pending = false
      }
    }
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh()
    })
    const timer = setInterval(() => void refresh(), 15000)
    return () => {
      active = false
      clearInterval(timer)
      subscription.remove()
    }
  }, [path])
  return { data, error, loading, reload, setData }
}
