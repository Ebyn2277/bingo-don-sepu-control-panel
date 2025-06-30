function InfoSection({
  availableTickets,
  totalTickets,
  paymentGatewayData,
  fetchGeneralData,
}) {
  const formatToLocalTime = (utcTime) =>
    new Date(utcTime).toLocaleString("es-CO");

  return (
    <section className="info-section">
      <h2>Información General</h2>
      <button id="refreshData" onClick={fetchGeneralData}>
        Actualizar Datos
      </button>
      <ul id="info-container">
        <li>
          Número de cartones disponibles:{" "}
          <span id="available-tickets">{availableTickets}</span> /{" "}
          <span className="totalTickets">{totalTickets}</span>
        </li>
        <li>
          Número de cartones vendidos:{" "}
          <span id="sold-tickets">{totalTickets - availableTickets}</span> /{" "}
          <span className="totalTickets">{totalTickets}</span>
        </li>
        <li>
          Estado de la pasarela de pago:{" "}
          <span id="payment-gateway-status">
            {paymentGatewayData
              ? paymentGatewayData.enabled
                ? "Abierta"
                : "Cerrada"
              : "Desconocido"}
          </span>
        </li>
        {paymentGatewayData ? (
          <li>
            Pasarela abierta:
            <br /> Desde{" "}
            <span>{formatToLocalTime(paymentGatewayData.enabled_from)}</span>
            <br /> Hasta{" "}
            <span>{formatToLocalTime(paymentGatewayData.enabled_until)}</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

export default InfoSection;
