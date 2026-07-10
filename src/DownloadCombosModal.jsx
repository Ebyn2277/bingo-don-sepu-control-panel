import { useEffect, useState } from "react";
import "./Dashboard.css";
import "./OrderValidationModal.css";
import "./DownloadCombosModal.css";

function DownloadCombosModal({ order, setIsOpen, orderComboNumbers = [] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => setIsOpen(false), 180);
  };

  const handleDownloadSheet = (sheet) => {
    if (!sheet?.source_url) return;
    window.open(sheet.source_url, "_blank");
  };

  return (
    <div className="validating-modal-container">
      <div className={`validating-modal ${open ? "open" : ""}`}>
        <button className="close-modal-button" onClick={handleClose}>
          Cerrar
        </button>

        <h2>Descargar combos</h2>

        <div className="modal-summary">
          <p className="summary-name">{order?.user_name}</p>
          <p className="summary-combos">
            {orderComboNumbers?.length
              ? `Combos ${orderComboNumbers.join(", ")}`
              : `${order?.sheet_count ?? 0} combos`}
          </p>

          {order?.sheets?.length > 0 && (
            <div className="modal-tickets-container">
              <p className="tickets-title">Archivos:</p>
              <ul>
                {order.sheets.map((sheet, index) => (
                  <li key={sheet.id} className="sheet-download-item">
                    <span>Combo {orderComboNumbers && orderComboNumbers[index] ? orderComboNumbers[index] : sheet.id}</span>
                    <button
                      type="button"
                      className="validate-confirm-button"
                      onClick={() => handleDownloadSheet(sheet)}
                    >
                      Descargar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DownloadCombosModal;
