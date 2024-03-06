import React, { useCallback, useEffect, useMemo, useState } from 'react'

const PeerContext = React.createContext(null)

export const usePeer = () => {
  const context = React.useContext(PeerContext)
  if (!context) {
    throw new Error('usePeer must be used within a PeerProvider')
  }
  return context
}

export const PeerProvider = ({ children }) => {
  const [remoteStream, setRemoteStream] = useState(null)
  const peer = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              'stun:stun.l.google.com:19302',
              'stun:global.stun.twilio.com:3478'
            ]
          }
        ]
      }),
    []
  )

  const createOffer = useCallback(async () => {
    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    return offer
  }, [peer])

  const createAnswer = useCallback(
    async offer => {
      await peer.setRemoteDescription(offer)
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      return answer
    },
    [peer]
  )

  const setRemoteAnswer = useCallback(
    async answer => {
      await peer.setRemoteDescription(answer)
    },
    [peer]
  )

  const sendStream = useCallback(
    async stream => {
      const tracks = stream.getTracks()
      for (const track of tracks) {
        peer.addTrack(track, stream)
      }
    },
    [peer]
  )

  const handleTrackEvent = useCallback(
    event => {
      const streams = event.streams[0]
      setRemoteStream(streams)
    },
    [setRemoteStream]
  )

  useEffect(() => {
    peer.addEventListener('track', handleTrackEvent)

    return () => {
      peer.removeEventListener('track', handleTrackEvent)
    }
  }, [peer, handleTrackEvent])

  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteAnswer,
        sendStream,
        remoteStream
      }}
    >
      {children}
    </PeerContext.Provider>
  )
}
