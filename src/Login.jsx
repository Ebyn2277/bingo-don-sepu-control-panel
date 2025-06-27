import { useState } from 'react'

export default function Login({ setIsLoggedIn }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    
    const handleOnChangeEmail = (e) => {
        setEmail(e.target.value)
    }

    const handleOnChangePassword = (e) => {
        setPassword(e.target.value)
    }

    const handleOnSubmit = async (e) => {
        e.preventDefault()

        try {
        const response = await fetch('http://localhost:8000/api/login', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        })
        
        if (!response.ok) {
            throw new Error('Login failed')
        }

        const data = await response.json()
        localStorage.setItem('access_token', data.access_token)
        setIsLoggedIn(true)
        } catch (error) {
        console.error('Error during login:', error)
        alert('Login failed. Please check your credentials.')
        }
    }

    
    return (
        <div className="login-container">
            <h1>Panel de Control</h1>
            <form onSubmit={handleOnSubmit}>
            <div className="form-group">
                <label htmlFor="email">Correo Electrónico:</label>
                <input
                type="email"
                id="email"
                value={email}
                onChange={handleOnChangeEmail}
                required
                />
            </div>
            <div className="form-group">
                <label htmlFor="password">Contraseña:</label>
                <input
                type="password"
                id="password"
                value={password}
                onChange={handleOnChangePassword}
                required
                />
            </div>
            <button type="submit">Iniciar Sesión</button>
            </form>
        </div>
    )
}