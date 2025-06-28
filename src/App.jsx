import './App.css'
import { useEffect, useState } from 'react'
import Login from './Login'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'))

  const [availableTickets, setAvailableTickets] = useState(0)
  const [totalTickets, setTotalTickets] = useState(0)
  const [paymentGatewayStatus, setPaymentGatewayStatus] = useState('Desconocido')
  const [pricePerTicket, setPricePerTicket] = useState(0)

  const [orders, setOrders] = useState([])

  const [isValidating, setIsValidating] = useState(false)
  const [validatingOrder, setValidatingOrder] = useState(null)
  
  const validateOrder = async (isValid) => {
    if (!validatingOrder) return
    
    const updatedOrder = {
      ...validatingOrder,
      payment_proof_validated: isValid
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/orders/${validatingOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(updatedOrder)
      })
      if (!response.ok) {
        const data = await response.json()
        if (data.message) {
          console.error('Validation error:', data.message)
          if (data.message === 'Unauthenticated.') {
            setIsLoggedIn(false)
            setAccessToken(null)
            localStorage.removeItem('access_token')
            return
          }
        }
        throw new Error('Failed to validate order')
      }
      const data = await response.json()
      console.log('Order validated successfully:', data)
      setValidatingOrder({
        ...validatingOrder,
        payment_proof_validated: isValid
      })
      // Refresh orders data after validation
      fetchOrdersData()
    } catch (error) {
      console.error('Error validating order:', error)
      alert('Hubo un fallo al validar la orden. Por favor, intentelo de nuevo.')
      setIsValidating(false)
      setValidatingOrder(null)
    }
  }

  const handleClickShowValidatingModal = order => {
    if (isValidating) return
    setIsValidating(true)
    setValidatingOrder(order)
  }

  const fetchPaymentGatewayData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/payment-gateways/1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })
      if (!response.ok) {
        const data = await response.json()
        if (data.message) {
          console.error('Fetch error:', data.message)
          if (data.message === 'Unauthenticated.') {
            setIsLoggedIn(false)
            setAccessToken(null)
            localStorage.removeItem('access_token')
            return
          }
        }
        throw new Error('Failed to fetch data')
      }
      const data = await response.json()
      setPaymentGatewayStatus(data.enabled ? 'Habilitada' : 'Deshabilitado')
      setPricePerTicket(data.ticket_price || 0)
      console.log('Payment gateway status fetched successfully:', data)
    } catch (error) {
      console.error('Error fetching payment gateway status:', error)
      setPaymentGatewayStatus('Error al obtener el estado')
      setPricePerTicket(0)
    }
  }

  const fetchTicketsData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/tickets/data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })
      if (!response.ok) {
        const data = await response.json()
        if (data.message) {
          console.error('Fetch error:', data.message)
          if (data.message === 'Unauthenticated.') {
            setIsLoggedIn(false)
            setAccessToken(null)
            localStorage.removeItem('access_token')
            return
          }
        }
        throw new Error('Failed to fetch tickets data')
      }
      const data = await response.json()
      setAvailableTickets(data.available_tickets_count || 0)
      setTotalTickets(data.last_tickets_submitted_count || 0)
    } catch (error) {
      console.error('Error fetching tickets data:', error)
      setAvailableTickets(0)
    }
  }

  const fetchOrdersData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })
      if (!response.ok) {
        const data = await response.json()
        if (data.message) {
          console.error('Fetch error:', data.message)
          if (data.message === 'Unauthenticated.') {
            setIsLoggedIn(false)
            setAccessToken(null)
            localStorage.removeItem('access_token')
            return
          }
        }
        throw new Error('Failed to fetch orders data')
      }
      const data = await response.json()
      setOrders(data)
      console.log('Orders fetched successfully:', data)
    } catch (error) {
      console.error('Error fetching orders data:', error)
      setOrders([])
    }
  }

  const fetchGeneralData = async () => {
    await fetchPaymentGatewayData()
    await fetchTicketsData()
  }

  const handleLogout = async () => {
    localStorage.removeItem('access_token')
    setIsLoggedIn(false)
    setAccessToken(null)

    try {
      const response = await fetch('http://localhost:8000/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (!response.ok) {
        const data = await response.json()
        if (data.message) {
          console.error('Logout error:', data.message)
        }
        throw new Error('Logout failed')
      }
      console.log('Logout successful')
    } catch (error) {
      console.error('Error during logout:', error)
      alert('Hubo un fallo al cerrar sessión. Por favor, intentelo de nuevo.')
    }
  }

  // Fetch data when the component mounts or when accessToken changes
  useEffect(() => {
    fetchGeneralData()
    fetchOrdersData()
  }, [accessToken])

  if (!isLoggedIn && !accessToken) {
    return <Login setIsLoggedIn={setIsLoggedIn} setAccessToken={setAccessToken} />
  }

  return (
    <div className="app-container">
      <button onClick={handleLogout}>Cerrar sesión</button>
      <section className="info-section">
        <h2>Información de estado</h2>
        <button id="refreshData" onClick={fetchGeneralData}>Actualizar Datos</button>
        <ul id="info-container">
          <li>Número de cartones disponibles: <span id="available-tickets">{availableTickets}</span> / <span className="totalTickets">{totalTickets}</span></li>
          <li>Número de cartones vendidos: <span id="sold-tickets">{totalTickets - availableTickets}</span> / <span className="totalTickets">{totalTickets}</span></li>
          <li>Estado de la pasarela de pago: <span id="payment-gateway-status">{paymentGatewayStatus}</span></li>
        </ul>
      </section>

      <section className="orders-section">
        <h2>Órdenes</h2>
        <button id="refreshOrders" onClick={fetchOrdersData}>Actualizar Ordenes</button>
        <table id="orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Número de Whatsapp</th>
              <th>Número de Cartones</th>
              <th>Total Pagado</th>
              <th>Fecha de Compra</th>
              <th>Hora de Compra</th>
              <th>Comprobante de Pago</th>
              <th>Estado de Validación</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.user_name}</td>
                  <td>{order.user_whatsapp}</td>
                  <td>{order.ticket_count}</td>
                  <td>${(order.ticket_count * pricePerTicket).toFixed(2)}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>{new Date(order.created_at).toLocaleTimeString()}</td>
                  <td>
                    {order.payment_proof_source_url ? (
                      <a href={order.payment_proof_source_url} target="_blank" rel="noopener noreferrer">Ver Comprobante</a>
                    ) : (
                      'No disponible'
                    )}
                  </td>
                  <td>
                    <button className="validate-button" onClick={() => handleClickShowValidatingModal(order)}>
                      {order.payment_proof_validated === null ? 'Pendiente' :
                        order.payment_proof_validated ? 'Valido' : 'No Valido'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No hay órdenes disponibles.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      {isValidating && validatingOrder && (
        <div className="validating-modal">
          <button className="close-button" onClick={() => setIsValidating(false)}>Cerrar</button>
          <ul>
            <li>Validando orden ID: {validatingOrder.id}</li>
            <li>Nombre: {validatingOrder.user_name}</li>
            <li>Número de Whatsapp: {validatingOrder.user_whatsapp}</li>
            <li>Número de Cartones: {validatingOrder.ticket_count}</li>
            <li>Total Pagado: ${(validatingOrder.ticket_count * pricePerTicket).toFixed(2)}</li>
            <li>Fecha de Compra: {new Date(validatingOrder.created_at).toLocaleDateString()}</li>
            <li>Hora de Compra: {new Date(validatingOrder.created_at).toLocaleTimeString()}</li>
            <li>Comprobante de Pago: {validatingOrder.payment_proof_source_url ?
              <a href={validatingOrder.payment_proof_source_url} target="_blank" rel="noopener noreferrer">Ver Comprobante</a> :
              'No disponible'}</li>
            <li>Estado de Validación: {validatingOrder.payment_proof_validated === null ? 'Pendiente' :
              validatingOrder.payment_proof_validated ? 'Valido' : 'No Valido'}</li>
          </ul>
          <div className="validation-buttons-container">
            <button className="validate-confirm-button" onClick={() => {validateOrder(true)}}>Es Valido</button>
            <button className="validate-cancel-button" onClick={() => {validateOrder(false)}}>No es Valido</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
