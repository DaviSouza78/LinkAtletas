import { useEffect } from 'react'

export function usePersistedRefresh(reload: () => Promise<void>) {
  useEffect(() => {
    let running = false
    const refresh = async () => {
      if (document.visibilityState !== 'visible' || running) return
      running = true
      try {
        await reload()
      } finally {
        running = false
      }
    }
    const timer = setInterval(() => void refresh(), 10000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [reload])
}
