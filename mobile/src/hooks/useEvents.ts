import { useEffect, useRef } from 'react'
import type { InteractionEvent } from '../../../shared/interaction-contracts'
import { connectEvents } from '../services/api'

export function useEvents(onEvent: (event: InteractionEvent) => void) {
  const callback = useRef(onEvent)
  callback.current = onEvent
  useEffect(() => {
    let mounted = true,
      socket: WebSocket | null = null,
      retry: ReturnType<typeof setTimeout> | null = null
    const connect = () => {
      if (!mounted) return
      socket = connectEvents(
        (event) => callback.current(event as InteractionEvent),
        () => {
          if (mounted) retry = setTimeout(connect, 3000)
        },
      )
    }
    connect()
    return () => {
      mounted = false
      if (retry) clearTimeout(retry)
      socket?.close()
    }
  }, [])
}
