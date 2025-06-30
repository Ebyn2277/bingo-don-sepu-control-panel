function TicketsSection({
  availableTickets,
  totalTickets,
  refetchTicketsData,
}) {
  return (
    <section className="tickets-section">
      <h2>Combos</h2>
      <button id="refetchTicketsData" onClick={refetchTicketsData}>
        Actualizar Datos
      </button>
      <ul id="info-container">
        <li>
          Número de combos disponibles:{" "}
          <span id="available-tickets">{availableTickets}</span> /{" "}
          <span className="totalTickets">{totalTickets}</span>
        </li>
        <li>
          Número de combos vendidos:{" "}
          <span id="sold-tickets">{totalTickets - availableTickets}</span> /{" "}
          <span className="totalTickets">{totalTickets}</span>
        </li>
      </ul>
    </section>
  );
}

export default TicketsSection;
