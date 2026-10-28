import type { InteractionEvent } from '../../shared/interaction-contracts'
import { useRef, useState, useEffect } from 'react'

export function useEvents(onEvent: (event: InteractionEvent) => void) {
  const handler = useRef(onEvent)
  handler.current = onEvent
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    let stopped = false
    let socket: WebSocket | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    function connect() {
      socket = new WebSocket(
        `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/events`,
      )
      socket.onopen = () => {
        if (!stopped) setConnected(true)
      }
      socket.onmessage = (e) => {
        if (stopped) return
        try {
          handler.current(JSON.parse(e.data) as InteractionEvent)
        } catch {
          /* Ignore invalid events; persisted data remains authoritative. */
        }
      }
      socket.onerror = () => {
        if (!stopped) socket?.close()
      }
      socket.onclose = () => {
        if (stopped) return
        setConnected(false)
        timer = setTimeout(connect, 3000)
      }
    }
    connect()
    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
      socket?.close()
    }
  }, [])
  return connected
}
