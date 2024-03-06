import { Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './pages/Home'
import { RoomPage } from './pages/Room'
import { PeerProvider } from './providers/Peer'
import { SocketProvider } from './providers/Socket'

function App() {
  return (
    <div className="App">
      <SocketProvider>
        <PeerProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
          </Routes>
        </PeerProvider>
      </SocketProvider>
    </div>
  )
}

export default App
