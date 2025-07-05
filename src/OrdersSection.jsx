import { useState, useRef, useEffect } from "react";
import "./Dashboard.css";
import "./OrdersSection.css";

function OrdersSection({
  orders,
  pricePerTicket,
  refetchOrdersData,
  handleClickShowValidatingModal,
}) {
  const [tableOrders, setTableOrders] = useState(orders);
  const [searchParam, setSearchParam] = useState("");
  const timeoutRef = useRef();

  const handleOnChangeOrdersSearch = (e) => {
    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setSearchParam(e.target.value);
    }, 500);
  };

  useEffect(() => {
    setTableOrders(orders);
    console.log(orders);
  }, [orders]);

  useEffect(() => {
    const filteredOrders = orders?.filter(
      (order) =>
        order.user_whatsapp.includes(searchParam) ||
        order.user_name.includes(searchParam)
    );

    setTableOrders(filteredOrders);
  }, [searchParam]);

  return (
    <section className="orders-section">
      <div className="section-header">
        <h2>Órdenes</h2>
        <ul id="header-elements-container">
          <li>
            <input
              type="search"
              name=""
              id="orders-search"
              placeholder="Buscar... (WhatsApp/Nombre)"
              onChange={handleOnChangeOrdersSearch}
            />
          </li>
          <li>
            <button id="refreshOrders" onClick={refetchOrdersData}>
              Actualizar
            </button>
          </li>
        </ul>
      </div>
      <div id="orders-table-container">
        <table id="orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Número de Whatsapp</th>
              <th>Número de Combos</th>
              <th>Combos</th>
              <th>Total Pagado</th>
              <th>Fecha de Compra</th>
              <th>Hora de Compra</th>
              <th>Estado de Validación</th>
            </tr>
          </thead>
          <tbody>
            {tableOrders && tableOrders.length > 0 ? (
              tableOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.user_name}</td>
                  <td>{order.user_whatsapp}</td>
                  <td>{order.ticket_count}</td>
                  <td className="tickets-container">
                    {order.tickets.map((value, index) => (
                      <a
                        href={value.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ticket {index + 1}
                      </a>
                    ))}
                  </td>
                  <td>${(order.ticket_count * pricePerTicket).toFixed(2)}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>{new Date(order.created_at).toLocaleTimeString()}</td>
                  <td>
                    <button
                      className={`validate-button ${
                        order.payment_proof_validated === null
                          ? "pendiente"
                          : order.payment_proof_validated
                          ? "valido"
                          : "no-valido"
                      }`}
                      onClick={() => handleClickShowValidatingModal(order)}
                    >
                      {order.payment_proof_validated === null
                        ? "Pendiente"
                        : order.payment_proof_validated
                        ? "Valido"
                        : "No Valido"}
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
      </div>
    </section>
  );
}

export default OrdersSection;
