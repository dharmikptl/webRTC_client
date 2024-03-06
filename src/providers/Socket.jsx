import React, { useMemo } from 'react'
import { io } from 'socket.io-client'
const SocketContext = React.createContext(null)

export const useSocket = () => {
  const context = React.useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => io('http://192.168.3.131:8001'), [])
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  )
}
