import React, { useCallback, useEffect, useState } from 'react'
import io from 'socket.io-client'

const socket = io.connect('http://localhost:8000')

function App() {
  const [peerConnections, setPeerConnections] = useState({})
  const [localStream, setLocalStream] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState([])

  const createPeerConnection = useCallback(
    receiverId => {
      const peerConnection = new RTCPeerConnection()
      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          socket.emit('icecandidate', {
            receiver: receiverId,
            candidate: event.candidate
          })
        }
      }
      peerConnection.ontrack = event => {
        setRemoteStreams(prevStreams => [...prevStreams, event.streams[0]])
      }
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
      })
      setPeerConnections(prevPeerConnections => ({
        ...prevPeerConnections,
        [receiverId]: peerConnection
      }))
      return peerConnection
    },
    [localStream]
  )

  const handleOffer = useCallback(
    offer => {
      const peerConnection = createPeerConnection(offer.sender)
      peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer.offer)
      )
      peerConnection
        .createAnswer()
        .then(answer => {
          peerConnection.setLocalDescription(answer)
          socket.emit('answer', { receiver: offer.sender, answer: answer })
        })
        .catch(error => {
          console.error('Error creating answer.', error)
        })
    },
    [createPeerConnection]
  )

  const handleAnswer = useCallback(
    answer => {
      const peerConnection = peerConnections[answer.sender]
      if (peerConnection) {
        peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer.answer)
        )
      }
    },
    [peerConnections]
  )

  const handleNewIceCandidate = useCallback(
    candidate => {
      const peerConnection = peerConnections[candidate.sender]
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate.candidate))
      }
    },
    [peerConnections]
  )

  const startCall = () => {
    // Send offer to all clients
    Object.keys(peerConnections).forEach(receiverId => {
      const peerConnection = peerConnections[receiverId]
      peerConnection
        .createOffer()
        .then(offer => {
          peerConnection.setLocalDescription(offer)
          socket.emit('offer', { receiver: receiverId, offer: offer })
        })
        .catch(error => {
          console.error('Error creating offer.', error)
        })
    })
  }
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream)
      })
      .catch(error => {
        console.error('Error accessing media devices.', error)
      })

    socket.on('offer', handleOffer)
    socket.on('answer', handleAnswer)
    socket.on('icecandidate', handleNewIceCandidate)

    return () => {
      socket.off('offer', handleOffer)
      socket.off('answer', handleAnswer)
      socket.off('icecandidate', handleNewIceCandidate)
    }
  }, [handleAnswer, handleNewIceCandidate, handleOffer])

  return (
    <div>
      <button onClick={startCall}>Start Call</button>
      <div>
        <h3>Local Stream</h3>
        {localStream && <video srcObject={localStream} autoPlay muted />}
      </div>
      <div>
        <h3>Remote Streams</h3>
        {remoteStreams.map((stream, index) => (
          <video key={index} srcObject={stream} autoPlay />
        ))}
      </div>
    </div>
  )
}

export default App
