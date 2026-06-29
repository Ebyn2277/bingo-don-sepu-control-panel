import { useState, useContext, useEffect } from "react";
import { AuthContext } from "./context/AuthContext";
import "./Dashboard.css";
import "./PaymentGatewaySection.css";

function PaymentGatewaySection({
  paymentGatewayData,
  setPaymentGatewayData,
  refetchPaymentGatewayData,
}) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { accessToken, logout } = useContext(AuthContext);

  const [enabledFrom, setEnabledFrom] = useState("");
  const [enabledUntil, setEnabledUntil] = useState("");
  const [isPaymentGatewayEnabled, setIsPaymentGatewayEnabled] = useState(false);
  const [isEnablingPaymentGateway, setIsEnablingPaymentGateway] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const formatToLocalTime = (utcTime) =>
    new Date(utcTime).toLocaleString("es-CO");

  useEffect(() => {
    if (!paymentGatewayData) return;

    if (!paymentGatewayData.enabled) {
      setIsPaymentGatewayEnabled(false);
      return;
    }

    const from = new Date(paymentGatewayData.enabled_from);
    const until = new Date(paymentGatewayData.enabled_until);
    const now = new Date();

    setIsPaymentGatewayEnabled(now >= from && now <= until);
  }, [paymentGatewayData]);

  async function updatePaymentGatewayData(updatedData) {
    try {
      const response = await fetch(apiUrl + "api/payment-gateways/1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 && errorData.message === "Unauthenticated.") {
          logout();
          return false;
        }
        throw new Error(JSON.stringify(errorData));
      }

      const data = await response.json();
      setPaymentGatewayData(data);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  const handleClickDisable = async () => {
    await updatePaymentGatewayData({
      name: paymentGatewayData.name,
      enabled: false,
      enabled_from: null,
      enabled_until: null,
    });
  };

  function hasAtLeastOneDayBetween(date1, date2) {
    const d1 = Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate());
    const d2 = Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate());
    return Math.abs(d1 - d2) >= 24 * 60 * 60 * 1000;
  }

  const handleClickOnSubmit = async (e) => {
    e.preventDefault();

    if (!enabledFrom || !enabledUntil) {
      alert("Se deben establecer las fechas en que estará habilitada la pasarela de pago.");
      return;
    }

    const from = new Date(enabledFrom + "T00:00:00");
    const until = new Date(enabledUntil + "T00:00:00");

    if (from > until) {
      alert("La fecha de inicio no puede ser mayor que la fecha final.");
      return;
    }

    if (!hasAtLeastOneDayBetween(from, until)) {
      alert("Debe haber al menos un día entre la fecha de inicio y la fecha final.");
      return;
    }

    const success = await updatePaymentGatewayData({
      name: paymentGatewayData.name,
      enabled: true,
      enabled_from: from,
      enabled_until: until,
    });

    if (success) setIsEnablingPaymentGateway(false);
  };

  // Resets the game: frees all sheets, clears gateway dates, records reset timestamp.
  // The panel will then only show orders created after this moment.
  const handleClickResetGame = async () => {
    if (
      !window.confirm(
        "¿Reiniciar el juego?\n\nEsto liberará TODOS los cartones (incluidos los vendidos) y ocultará las órdenes anteriores del panel.\n\nLas órdenes no se borrarán de la base de datos."
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch(apiUrl + "api/payment-gateways/reset-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 && errorData.message === "Unauthenticated.") {
          logout();
          return;
        }
        throw new Error(errorData.error || "Error al reiniciar el juego.");
      }

      await refetchPaymentGatewayData();
      alert("El juego ha sido reiniciado correctamente.");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <section className="payment-gateway-section">
      <div className="section-header">
        <h2>Pasarela de Pago</h2>
        <button id="refetchPaymentGatewayData" onClick={refetchPaymentGatewayData}>
          Actualizar
        </button>
      </div>

      {paymentGatewayData ? (
        <ul>
          <li>
            Estado:{" "}
            <span id="payment-gateway-status">
              {isPaymentGatewayEnabled ? "Abierta" : "Cerrada"}
            </span>
          </li>

          {paymentGatewayData.enabled_from && paymentGatewayData.enabled_until && (
            <li id="enabled-dates">
              <p>
                {isPaymentGatewayEnabled
                  ? "Pasarela abierta..."
                  : new Date() > new Date(paymentGatewayData.enabled_until)
                  ? "La pasarela se abrió..."
                  : "La pasarela se abrirá..."}
              </p>
              <p>
                ...desde el{" "}
                <span>{formatToLocalTime(paymentGatewayData.enabled_from)}</span>
              </p>
              <p>
                ...hasta el{" "}
                <span>{formatToLocalTime(paymentGatewayData.enabled_until)}</span>
              </p>
            </li>
          )}

          <li id="enabled-functions">
            {isPaymentGatewayEnabled ? (
              <button onClick={handleClickDisable}>Deshabilitar</button>
            ) : !isEnablingPaymentGateway ? (
              <button onClick={() => setIsEnablingPaymentGateway(true)}>
                {paymentGatewayData.enabled_from && paymentGatewayData.enabled_until
                  ? "Cambiar fechas hábiles"
                  : "Habilitar"}
              </button>
            ) : (
              <form onSubmit={handleClickOnSubmit}>
                <label>Desde el:</label>
                <input
                  type="date"
                  value={enabledFrom}
                  onChange={(e) => setEnabledFrom(e.target.value)}
                />
                <label>Hasta el:</label>
                <input
                  type="date"
                  value={enabledUntil}
                  onChange={(e) => setEnabledUntil(e.target.value)}
                />
                <button type="submit">Habilitar</button>
                <button type="button" onClick={() => setIsEnablingPaymentGateway(false)}>
                  Cancelar
                </button>
              </form>
            )}
          </li>

          {/* Game reset — destructive action, requires explicit confirmation */}
          <li id="reset-game-section">
            <button
              className="reset-game-button"
              onClick={handleClickResetGame}
              disabled={isResetting}
            >
              {isResetting ? "Reiniciando..." : "Reiniciar juego"}
            </button>
            <p className="reset-game-description">
              Libera todos los cartones y oculta las órdenes anteriores del panel.
              Las órdenes no se eliminan de la base de datos.
            </p>
          </li>
        </ul>
      ) : (
        <div>No hay información de la pasarela de pago disponible.</div>
      )}
    </section>
  );
}

export default PaymentGatewaySection;