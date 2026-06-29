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

  const [isPaymentGatewayEnabled, setIsPaymentGatewayEnabled] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!paymentGatewayData) return;
    setIsPaymentGatewayEnabled(Boolean(paymentGatewayData.enabled));
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

  const handleTogglePaymentGateway = async () => {
    await updatePaymentGatewayData({
      name: paymentGatewayData.name,
      enabled: !paymentGatewayData.enabled,
    });
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

          <li id="enabled-functions">
            <button onClick={handleTogglePaymentGateway}>
              {isPaymentGatewayEnabled ? "Deshabilitar pasarela" : "Habilitar pasarela"}
            </button>
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