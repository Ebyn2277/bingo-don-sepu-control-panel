import './App.css'
import { useState } from 'react'
import Login from './Login'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return <Login setIsLoggedIn={setIsLoggedIn} />
  }

  return (
    <div className="app-container">
      <h1>Panel de Control</h1>
      <p>Bienvenido al panel de control de Bingo Don Sepu.</p>
      <p>¡Aquí podrás gestionar todo lo relacionado con el bingo!</p>
      <button onClick={() => setIsLoggedIn(false)}>Cerrar sesión</button>
    </div>
  )
}

export default App
