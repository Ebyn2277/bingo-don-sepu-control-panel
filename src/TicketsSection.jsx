import "./Dashboard.css";
import "./TicketsSection.css";

function TicketsSection({
  availableTickets,
  totalTickets,
  refetchTicketsData,
}) {
  return (
    <section className="tickets-section">
      <div className="section-header">
        <h2>Combos</h2>
        <button id="refetchTicketsData" onClick={refetchTicketsData}>
          Actualizar
        </button>
      </div>
      <ul id="info-container">
        <li>
          <p>Número de combos disponibles:</p>
          <span>
            {availableTickets} / {totalTickets}
          </span>
        </li>
        <li>
          <p>Número de combos vendidos:</p>
          <span>
            {totalTickets - availableTickets} / {totalTickets}
          </span>
        </li>
      </ul>
    </section>
  );
}

export default TicketsSection;
