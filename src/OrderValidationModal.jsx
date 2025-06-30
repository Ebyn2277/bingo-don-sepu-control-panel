function OrderValidationModal({
  validatingOrder,
  setIsValidating,
  pricePerTicket,
  validateOrder,
}) {
  const handleOnClickCloseModal = () => {
    setIsValidating(false);
  };

  return (
    <div className="validating-modal">
      <button className="close-button" onClick={handleOnClickCloseModal}>
        Cerrar
      </button>
      <ul>
        <li>Validando orden ID: {validatingOrder.id}</li>
        <li>Nombre: {validatingOrder.user_name}</li>
        <li>Número de Whatsapp: {validatingOrder.user_whatsapp}</li>
        <li>Número de Cartones: {validatingOrder.ticket_count}</li>
        <li>
          Total Pagado: $
          {(validatingOrder.ticket_count * pricePerTicket).toFixed(2)}
        </li>
        <li>
          Fecha de Compra:{" "}
          {new Date(validatingOrder.created_at).toLocaleDateString()}
        </li>
        <li>
          Hora de Compra:{" "}
          {new Date(validatingOrder.created_at).toLocaleTimeString()}
        </li>
        <li>
          Comprobante de Pago:{" "}
          {validatingOrder.payment_proof_source_url ? (
            <img src={`${validatingOrder.payment_proof_source_url}`}></img>
          ) : (
            "No disponible"
          )}
        </li>
        <li>
          Estado de Validación:{" "}
          {validatingOrder.payment_proof_validated === null
            ? "Pendiente"
            : validatingOrder.payment_proof_validated
            ? "Valido"
            : "No Valido"}
        </li>
      </ul>
      <div className="validation-buttons-container">
        <button
          className="validate-confirm-button"
          onClick={() => {
            validateOrder(true);
          }}
        >
          Es Valido
        </button>
        <button
          className="validate-cancel-button"
          onClick={() => {
            validateOrder(false);
          }}
        >
          No es Valido
        </button>
      </div>
    </div>
  );
}

export default OrderValidationModal;
