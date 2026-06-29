import { useEffect, useState } from "react";
import "./Dashboard.css";
import "./OrderValidationModal.css";

function OrderValidationModal({
  validatingOrder,
  comboLabel,
  setIsValidating,
  validateOrder,
  deleteOrder,
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
