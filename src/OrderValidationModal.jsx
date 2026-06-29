import "./Dashboard.css";
import "./OrderValidationModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";

function OrderValidationModal({
  validatingOrder,
  tableOrdersLength,
  setValidatingOrderIndex,
  setIsValidating,
  pricePerSheet,
  validateOrder,
  deleteOrder,
}) {
  const handleOnClickCloseModal = () => {
    setIsValidating(false);
  };

  const handleOnClickChangeOrder = (isNext) => {
    if (isNext) {
      setValidatingOrderIndex((prev) =>
        prev < tableOrdersLength - 1 ? prev + 1 : 0
      );
    } else {
      setValidatingOrderIndex((prev) =>
        prev > 0 ? prev - 1 : tableOrdersLength - 1
      );
    }
  };

  const validationState =
    validatingOrder.payment_proof_validated === null
      ? "pendiente"
      : validatingOrder.payment_proof_validated
      ? "valido"
      : "no-valido";

  const validationLabel =
    validatingOrder.payment_proof_validated === null
      ? "PENDIENTE"
      : validatingOrder.payment_proof_validated
      ? "VÁLIDO"
      : "NO VÁLIDO";

  return (
    <div className="validating-modal-container">
      <div className="event-overlay" onClick={handleOnClickCloseModal} />

      <div className="validating-modal">
        <div className="section-header">
          <h2>Validación de Compra</h2>
          <button className="close-modal-button" onClick={handleOnClickCloseModal}>
            Cerrar
          </button>
        </div>

        <button
          className="switch-order-button"
          onClick={() => handleOnClickChangeOrder(false)}
        >
          <FontAwesomeIcon icon={faAngleLeft} />
        </button>

        <ul>
          <li>ID de compra: <span>{validatingOrder.id}</span></li>
          <li>Nombre: <span>{validatingOrder.user_name}</span></li>
          <li>WhatsApp: <span>{validatingOrder.user_whatsapp}</span></li>
          <li>Cartones: <span>{validatingOrder.sheet_count}</span></li>
          <li>
            Total:
            <span>${validatingOrder.total_amount.toFixed(2)}</span>
          </li>
          <li>
            Fecha:{" "}
            <span>{new Date(validatingOrder.created_at).toLocaleDateString()}</span>
          </li>
          <li>
            Hora:{" "}
            <span>{new Date(validatingOrder.created_at).toLocaleTimeString()}</span>
          </li>
          <li>
            Cartones asignados:
            <span>
              {validatingOrder.sheets?.map((sheet) => (
                <span key={sheet.id} style={{ display: "block" }}>
                  <a href={sheet.source_url} target="_blank" rel="noopener noreferrer">
                    {sheet.tickets?.map((t) => t.id).join(", ")}
                  </a>
                </span>
              ))}
            </span>
          </li>
          <li>
            Estado:{" "}
            <span className={validationState}>{validationLabel}</span>
          </li>

          <li>
            <div id="validation-buttons-container">
              <button
                className="validate-confirm-button"
                onClick={() => validateOrder(true)}
              >
                ES VÁLIDO
              </button>
              <button
                className="validate-pending-button"
                onClick={() => validateOrder(null)}
              >
                PENDIENTE
              </button>
              <button
                className="validate-cancel-button"
                onClick={() => validateOrder(false)}
              >
                NO ES VÁLIDO
              </button>
            </div>
          </li>

          {/* Only allow deleting non-validated orders */}
          {validatingOrder.payment_proof_validated !== true && (
            <li>
              <button
                className="delete-order-button"
                onClick={() => {
                  if (
                    window.confirm(
                      `¿Eliminar la reserva #${validatingOrder.id}? Los cartones quedarán disponibles nuevamente.`
                    )
                  ) {
                    deleteOrder(validatingOrder.id);
                  }
                }}
              >
                Eliminar reserva y liberar cartones
              </button>
            </li>
          )}
        </ul>

        <button
          className="switch-order-button"
          onClick={() => handleOnClickChangeOrder(true)}
        >
          <FontAwesomeIcon icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}

export default OrderValidationModal;