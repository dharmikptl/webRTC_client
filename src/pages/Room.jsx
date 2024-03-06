import React, { useCallback, useEffect, useState } from 'react'
import ReactPlayer from 'react-player'
import { usePeer } from '../providers/Peer'
import { useSocket } from '../providers/Socket'

export const RoomPage = () => {
  const socket = useSocket()
  const [myStream, setMyStream] = useState(null)
  const [remoteEmail, setRemoteEmail] = useState()
  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    sendStream,
    remoteStream
  } = usePeer()

  const handleNewUserJoined = useCallback(
    async ({ emailId }) => {
      console.log('new user joined', emailId)
      const offer = await createOffer()
      socket.emit('call-user', { emailId, offer })
      setRemoteEmail(emailId)
    },
    [createOffer, socket, setRemoteEmail]
  )
  const handleIncommingCall = useCallback(
    async ({ offer, from }) => {
      console.log('incomming call from', from, offer)
      const answer = await createAnswer(offer)
      socket.emit('call-accepted', { emailId: from, answer })
      setRemoteEmail(from)
    },
    [createAnswer, socket, setRemoteEmail]
  )
  const handleCallAccepted = useCallback(
    async ({ answer }) => {
      console.log('call accepted', answer)
      setRemoteAnswer(answer)
    },
    [setRemoteAnswer]
  )

  const getUserMediaStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    setMyStream(stream)
  }, [setMyStream])

  const handleNegotiationNeeded = useCallback(async () => {
    const offer = await createOffer()
    socket.emit('call-user', { emailId: remoteEmail, offer })
  }, [createOffer, remoteEmail, socket])

  useEffect(() => {
    socket.on('user-connected', handleNewUserJoined)
    socket.on('incomming-call', handleIncommingCall)
    socket.on('call-accepted', handleCallAccepted)

    return () => {
      socket.off('user-connected', handleNewUserJoined)
      socket.off('incomming-call', handleIncommingCall)
      socket.off('call-accepted', handleCallAccepted)
    }
  }, [socket, handleNewUserJoined, handleIncommingCall, handleCallAccepted])

  useEffect(() => {
    peer.addEventListener('negotiationneeded', handleNegotiationNeeded)
    return () => {
      peer.removeEventListener('negotiationneeded', handleNegotiationNeeded)
    }
  }, [peer, handleNegotiationNeeded])

  useEffect(() => {
    getUserMediaStream()
  }, [getUserMediaStream])
  return (
    <>
      <h1>Room Page</h1>
      <button onClick={() => sendStream(myStream)}>Send My video</button>
      <ReactPlayer url={myStream} playing muted />
      <ReactPlayer url={remoteStream} playing />
    </>
  )
}
