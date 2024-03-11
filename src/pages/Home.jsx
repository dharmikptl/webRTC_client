import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../providers/Socket'

const HomePage = () => {
  const socket = useSocket()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [roomId, setRoomId] = useState('')

  const handleJoinRoom = () => {
    socket.emit('join-room', { roomId, emailId: email })
  }

  const handleRoomJoined = ({ roomId }) => {
    navigate(`/room/${roomId}`)
  }

  useEffect(() => {
    socket.on('joined-room', handleRoomJoined)
    return () => {
      socket.off('joined-room', handleRoomJoined)
    }
  }, [socket, handleRoomJoined])

  return (
    <div className="homepage-container">
      <div className="input-container">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="enter your email here"
        />
        <input
          type="text"
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
          placeholder="enter Room Code"
        />
        <button onClick={handleJoinRoom}>Enter Room</button>
      </div>
    </div>
  )
}

export default HomePage
