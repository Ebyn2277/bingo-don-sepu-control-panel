function OrdersSection({
  orders,
  pricePerTicket,
  refetchOrdersData,
  handleClickShowValidatingModal,
}) {
  return (
    <section className="orders-section">
      <h2>Órdenes</h2>
      <button id="refreshOrders" onClick={refetchOrdersData}>
        Actualizar Ordenes
      </button>
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
          {orders && orders.length > 0 ? (
            orders.map((order) => (
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
                    <a
                      href={order.payment_proof_source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver Comprobante
                    </a>
                  ) : (
                    "No disponible"
                  )}
                </td>
                <td>
                  <button
                    className="validate-button"
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
    </section>
  );
}

export default OrdersSection;
