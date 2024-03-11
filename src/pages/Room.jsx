// room.jsx
import React, { useEffect, useState } from 'react'
import { usePeer } from '../providers/Peer'
import { useSocket } from '../providers/Socket'

export const RoomPage = () => {
  const socket = useSocket()
  const [myStream, setMyStream] = useState(null)
  const [remoteEmails, setRemoteEmails] = useState([])
  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    sendStream,
    remoteStream
  } = usePeer()

  useEffect(() => {
    const handleNewUserJoined = ({ emailId }) => {
      console.log('New user joined:', emailId)
      setRemoteEmails(prevEmails => [...prevEmails, emailId])
    }

    const handleIncomingCall = async ({ offer, from }) => {
      console.log('Incoming call from:', from)
      const answer = await createAnswer(offer)
      socket.emit('call-accepted', { emailId: from, answer })
      setRemoteEmails(prevEmails => [...prevEmails, from])
    }

    const handleCallAccepted = async ({ answer }) => {
      console.log('Call accepted:', answer)
      setRemoteAnswer(answer)
    }

    socket.on('user-connected', handleNewUserJoined)
    socket.on('incoming-call', handleIncomingCall)
    socket.on('call-accepted', handleCallAccepted)

    return () => {
      socket.off('user-connected', handleNewUserJoined)
      socket.off('incoming-call', handleIncomingCall)
      socket.off('call-accepted', handleCallAccepted)
    }
  }, [socket, createAnswer, setRemoteAnswer])

  useEffect(() => {
    const initiateGroupCall = async () => {
      for (const emailId of remoteEmails) {
        const offer = await createOffer()
        socket.emit('call-user', { emailId, offer })
      }
    }

    initiateGroupCall()

    return () => {
      // Cleanup logic if needed
    }
  }, [createOffer, remoteEmails, socket])

  useEffect(() => {
    const getUserMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        setMyStream(stream)
      } catch (error) {
        console.error('Error accessing user media:', error)
      }
    }

    getUserMediaStream()

    return () => {
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [setMyStream])

  return (
    <div>
      <h1>Room Page</h1>
      <button onClick={() => sendStream(myStream)}>Send My Video</button>
      {remoteEmails.map(email => (
        <video key={email} srcObject={remoteStream} autoPlay />
      ))}
    </div>
  )
}
