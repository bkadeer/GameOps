import { useEffect, useRef, useCallback, useState } from 'react'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface UseWebSocketOptions {
  onStationUpdate?: (data: any) => void
  onSessionUpdate?: (data: any) => void
  onStatsUpdate?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const maxReconnectAttempts = 10
  const reconnectDelay = 5000 // 5 seconds - increased to reduce reconnection spam
  const isReconnectingRef = useRef<boolean>(false)

  const optionsRef = useRef(options)
  
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || isReconnectingRef.current) {
      return
    }

    isReconnectingRef.current = true

    try {
      const ws = new WebSocket(url)
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected')
        setIsConnected(true)
        setIsInitializing(false)
        setReconnectAttempts(0)
        isReconnectingRef.current = false
        optionsRef.current.onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('📨 WebSocket message:', message.type)

          switch (message.type) {
            case 'station_update':
              optionsRef.current.onStationUpdate?.(message.data)
              break
            case 'session_update':
              optionsRef.current.onSessionUpdate?.(message.data)
              break
            case 'stats_update':
              optionsRef.current.onStatsUpdate?.(message.data)
              break
            case 'server_shutdown':
              console.warn('⚠️ Server is shutting down')
              break
            default:
              console.log('Unknown message type:', message.type)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.warn('⚠️ WebSocket connection failed (real-time updates disabled)')
        console.debug('WebSocket URL:', url)
        console.debug('WebSocket readyState:', ws.readyState)
        setIsInitializing(false)
        isReconnectingRef.current = false
        optionsRef.current.onError?.(error)
      }

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected', event.code, event.reason)
        setIsConnected(false)
        setIsInitializing(false)
        isReconnectingRef.current = false
        optionsRef.current.onDisconnect?.()
        wsRef.current = null

        // Only reconnect if it wasn't a normal closure and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          console.log(`🔄 Reconnecting in ${reconnectDelay/1000}s... (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`)
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connect()
          }, reconnectDelay)
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached')
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Error creating WebSocket:', error)
      setIsInitializing(false)
      isReconnectingRef.current = false
    }
  }, [url, reconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  useEffect(() => {
    // Small delay to prevent initial glitch
    const initTimeout = setTimeout(() => {
      connect()
    }, 100)

    return () => {
      clearTimeout(initTimeout)
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    isInitializing,
    sendMessage,
    disconnect,
    reconnect: connect,
  }
}
