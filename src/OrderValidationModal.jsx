import { useEffect, useState } from "react";
import "./Dashboard.css";
import "./OrderValidationModal.css";

function OrderValidationModal({
  validatingOrder,
  comboLabel,
  setIsValidating,
  validateOrder,
  deleteOrder,
  orderComboNumbers,
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // play entrance animation
    setOpen(true);
  }, []);

  const handleOnClickCloseModal = () => {
    // play exit animation then unmount
    setOpen(false);
    setTimeout(() => setIsValidating(false), 180);
  };

  return (
    <div className="validating-modal-container">

      <div className={`validating-modal ${open ? "open" : ""}`}>
        <button className="close-modal-button" onClick={handleOnClickCloseModal}>
          Cerrar
        </button>

        <h2>Validación de compra</h2>

        <div className="modal-summary">
          <p className="summary-name">{validatingOrder.user_name}</p>
          <p className="summary-combos">
            {comboLabel ? `Combos ${comboLabel}` : `${validatingOrder.sheet_count} combos`}
          </p>
          {validatingOrder.sheets?.length > 0 && (
            <div className="modal-tickets-container">
              <p className="tickets-title">Cartones:</p>
              <ul>
                {validatingOrder.sheets?.map((sheet) => (
                  <li key={sheet.id}>
                    <a
                      href={sheet.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {sheet.tickets?.map((t) => t.id).join(", ")}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div id="validation-buttons-container">
          <button
            className="validate-confirm-button"
            onClick={() => validateOrder(true)}
          >
            Validar compra
          </button>
          <button
            className="validate-pending-button"
            onClick={() => validateOrder(null)}
          >
            Volver a pendiente
          </button>
          <button
            className="validate-cancel-button"
            onClick={() => deleteOrder(validatingOrder.id)}
          >
            Anular compra
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderValidationModal;
