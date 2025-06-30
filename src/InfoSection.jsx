function InfoSection({ availableTickets, totalTickets, paymentGatewayStatus, fetchGeneralData }) {
    return (
        <section className="info-section">
            <h2>Información de estado</h2>
            <button id="refreshData" onClick={fetchGeneralData}>Actualizar Datos</button>
            <ul id="info-container">
                <li>Número de cartones disponibles: <span id="available-tickets">{availableTickets}</span> / <span className="totalTickets">{totalTickets}</span></li>
                <li>Número de cartones vendidos: <span id="sold-tickets">{totalTickets - availableTickets}</span> / <span className="totalTickets">{totalTickets}</span></li>
                <li>Estado de la pasarela de pago: <span id="payment-gateway-status">{paymentGatewayStatus}</span></li>
                </ul>
        </section>
    )
}

export default InfoSection;