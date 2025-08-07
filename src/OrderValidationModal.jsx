import "./Dashboard.css";
import "./OrderValidationModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
  faPlus,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

function OrderValidationModal({
  validatingOrder,
  tableOrdersLength,
  setValidatingOrderIndex,
  setIsValidating,
  pricePerSheet,
  validateOrder,
}) {
  const [imageSize, setImageSize] = useState(100);

  const handleOnClickIncreaseImageSize = () => {
    setImageSize((prevSize) => prevSize + 25);
  };

  const handleOnClickDecreaseImageSize = () => {
    if (imageSize > 50) setImageSize((prevSize) => prevSize - 25);
  };

  const handleOnClickCloseModal = () => {
    setIsValidating(false);
  };

  const handleOnClickChangeOrder = (isNext) => {
    if (isNext) {
      setValidatingOrderIndex((prevIndex) =>
        prevIndex < tableOrdersLength - 1 ? prevIndex + 1 : 0
      );
    } else {
      setValidatingOrderIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : tableOrdersLength - 1
      );
    }
  };

  return (
    <div className="validating-modal-container">
      <div className="event-overlay" onClick={handleOnClickCloseModal}></div>{" "}
      {/** Overlay to close the modal on click */}
      <div className="validating-modal">
        <div className="section-header">
          <h2>Validación de Compra</h2>
          <button
            className="close-modal-button"
            onClick={handleOnClickCloseModal}
          >
            Cerrar
          </button>
        </div>
        <button
          className="switch-order-button"
          onClick={() => {
            handleOnClickChangeOrder(false);
          }}
        >
          <FontAwesomeIcon icon={faAngleLeft} />
        </button>
        <ul>
          <li>
            ID de compra: <span>{validatingOrder.id}</span>
          </li>
          <li>
            Nombre: <span>{validatingOrder.user_name}</span>
          </li>
          <li>
            Número de Whatsapp: <span>{validatingOrder.user_whatsapp}</span>
          </li>
          <li>
            Número de Cartones: <span>{validatingOrder.sheet_count}</span>
          </li>
          <li>
            Total Pagado:
            <span>
              $ {(validatingOrder.sheet_count * pricePerSheet).toFixed(2)}
            </span>
          </li>
          <li>
            Fecha de Compra:{" "}
            <span>
              {new Date(validatingOrder.created_at).toLocaleDateString()}
            </span>
          </li>
          <li>
            Hora de Compra:{" "}
            <span>
              {new Date(validatingOrder.created_at).toLocaleTimeString()}
            </span>
          </li>
          <li id="payment-proof">
            {validatingOrder.payment_proof_source_url ? (
              <>
                <div id="payment-proof-image-container">
                  <img
                    src={`${validatingOrder.payment_proof_source_url}`}
                    style={{ height: imageSize + "%" }}
                  ></img>
                </div>

                <div id="change-image-size-buttons">
                  <button
                    id="increase-image-size-button"
                    onClick={handleOnClickIncreaseImageSize}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                  <button
                    id="decrease-image-size-button"
                    onClick={handleOnClickDecreaseImageSize}
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                </div>
              </>
            ) : (
              "No disponible"
            )}
          </li>
          <li>
            Estado de Validación:{" "}
            <span
              className={`${
                validatingOrder.payment_proof_validated === null
                  ? "pendiente"
                  : validatingOrder.payment_proof_validated
                  ? "valido"
                  : "no-valido"
              }`}
            >
              {validatingOrder.payment_proof_validated === null
                ? "PENDIENTE"
                : validatingOrder.payment_proof_validated
                ? "VALIDO"
                : "NO VALIDO"}
            </span>
          </li>
          <li>
            <div id="validation-buttons-container">
              <button
                className="validate-confirm-button"
                onClick={() => {
                  validateOrder(true);
                }}
              >
                ES VALIDO
              </button>
              <button
                className="validate-cancel-button"
                onClick={() => {
                  validateOrder(false);
                }}
              >
                NO ES VALIDO
              </button>
            </div>
          </li>
        </ul>
        <button
          className="switch-order-button"
          onClick={() => {
            handleOnClickChangeOrder(true);
          }}
        >
          <FontAwesomeIcon icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}

export default OrderValidationModal;
