import { useState, useContext, useEffect } from "react";
import { AuthContext } from "./context/AuthContext";
import "./GameSettingsSection.css";

function GameSettingsSection({ paymentGatewayData, setPaymentGatewayData }) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { accessToken, logout } = useContext(AuthContext);

  const [sellLimit, setSellLimit] = useState("");
  const [visibleLimit, setVisibleLimit] = useState("");
  const [isSaving, setIsSaving]   = useState(false);
  const [feedback, setFeedback]   = useState(null);

  useEffect(() => {
    if (!paymentGatewayData) return;
    setSellLimit(String(paymentGatewayData.sell_limit ?? ""));
    setVisibleLimit(String(paymentGatewayData.visible_sheets_limit ?? ""));
  }, [paymentGatewayData]);

  const normalizedVisibleLimit = String(visibleLimit ?? "");
  const hasChanges =
    paymentGatewayData &&
    (parseInt(sellLimit, 10) !== paymentGatewayData.sell_limit ||
      normalizedVisibleLimit.trim() !== String(paymentGatewayData.visible_sheets_limit ?? ""));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const parsedLimit = parseInt(sellLimit, 10);
    const trimmedVisibleLimit = visibleLimit.trim();
    const parsedVisibleLimit = trimmedVisibleLimit === "" ? null : parseInt(trimmedVisibleLimit, 10);

    if (!parsedLimit || parsedLimit < 1) {
      setFeedback({ type: "error", message: "El límite debe ser un número entero mayor a 0." });
      return;
    }

    if (trimmedVisibleLimit !== "" && (!parsedVisibleLimit || parsedVisibleLimit < 1)) {
      setFeedback({ type: "error", message: "El límite visible debe ser un número entero mayor a 0 o estar vacío." });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${apiUrl}api/payment-gateways/1`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name:                  paymentGatewayData.name,
          sell_limit:            parsedLimit,
          visible_sheets_limit:  parsedVisibleLimit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 && errorData.message === "Unauthenticated.") {
          logout();
          return;
        }
        throw new Error(errorData.error || "Error al guardar los cambios.");
      }

      const updated = await response.json();
      setPaymentGatewayData(updated);
      setFeedback({ type: "success", message: "Configuración guardada correctamente." });
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="game-settings-section">
      <div className="section-header">
        <h2>Configuración del Juego</h2>
      </div>

      {paymentGatewayData ? (
        <form className="game-settings-form" onSubmit={handleSubmit}>

          <div className="setting-row">
            <label htmlFor="sell-limit">
              Máximo de combos por usuario
              <span className="setting-hint">
                Actual: <strong>{paymentGatewayData.sell_limit}</strong>
              </span>
            </label>
            <input
              id="sell-limit"
              type="number"
              min="1"
              value={sellLimit}
              onChange={(e) => setSellLimit(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="setting-row">
            <label htmlFor="visible-limit">
              Cantidad de cartones visibles en el frontend
              <span className="setting-hint">
                Actual: <strong>{paymentGatewayData.visible_sheets_limit ?? 'sin límite'}</strong>
              </span>
            </label>
            <input
              id="visible-limit"
              type="number"
              min="1"
              placeholder="Dejar vacío para sin límite"
              value={visibleLimit}
              onChange={(e) => setVisibleLimit(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {feedback && (
            <p className={`settings-feedback ${feedback.type}`}>
              {feedback.message}
            </p>
          )}

          <button
            type="submit"
            className="save-settings-button"
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>

          {!hasChanges && !isSaving && (
            <p className="settings-no-changes">Sin cambios pendientes.</p>
          )}

        </form>
      ) : (
        <p>Cargando configuración...</p>
      )}
    </section>
  );
}

export default GameSettingsSection;