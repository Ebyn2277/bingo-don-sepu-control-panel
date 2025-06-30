import { useContext, useState } from "react";
import { AuthContext } from "./context/AuthContext";

function InfoSection({
  availableTickets,
  totalTickets,
  paymentGatewayData,
  setPaymentGatewayData,
  refetchTicketsData,
  refetchPaymentGatewayData,
}) {
  const { accessToken, logout } = useContext(AuthContext);

  const formatToLocalTime = (utcTime) =>
    new Date(utcTime).toLocaleString("es-CO");

  const [isEnablingPaymentGateway, setIsEnablingPaymentGateway] = useState(
    paymentGatewayData ? paymentGatewayData.enabled : null
  );

  const handleClicktogglePaymentGatewayEnable = async () => {
    setIsEnablingPaymentGateway(!paymentGatewayData.enabled);

    // Logic to update payment gateway's status
    if (paymentGatewayData.enabled) {
      const updatedPaymentGatewayData = { name: paymentGatewayData.name };
      updatedPaymentGatewayData.enabled_from = null;
      updatedPaymentGatewayData.enabled_until = null;
      updatedPaymentGatewayData.enabled = false;

      try {
        const response = await fetch(
          "http://localhost:8000/api/payment-gateways/1",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(updatedPaymentGatewayData),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.message) {
            if (
              response.status === 401 &&
              errorData.message === "Unauthenticated."
            ) {
              console.error("User is unauthenticated, logging out.");
              logout();
              return;
            }

            throw new Error(
              "Failed to fetch data: ",
              errorData.message,
              response.status
            );
          }
          throw new Error("Failed to fetch data: ", errorData, response.status);
        }
        const data = await response.json();
        setPaymentGatewayData(data);
      } catch (error) {
        console.error(error);
      }
    }
  };
  return (
    <>
      <section className="tickets-section">
        <h2>Combos</h2>
        <button id="refetchTicketsData" onClick={refetchTicketsData}>
          Actualizar Datos
        </button>
        <ul id="info-container">
          <li>
            Número de combos disponibles:{" "}
            <span id="available-tickets">{availableTickets}</span> /{" "}
            <span className="totalTickets">{totalTickets}</span>
          </li>
          <li>
            Número de combos vendidos:{" "}
            <span id="sold-tickets">{totalTickets - availableTickets}</span> /{" "}
            <span className="totalTickets">{totalTickets}</span>
          </li>
        </ul>
      </section>

      <section className="payment-gateway-section">
        <h2>Pasarela de Pago</h2>
        <button
          id="refetchPaymentGatewayData"
          onClick={refetchPaymentGatewayData}
        >
          Actualizar Datos
        </button>
        {paymentGatewayData ? (
          <ul>
            <li>
              Estado de la pasarela de pago:{" "}
              <span id="payment-gateway-status">
                {paymentGatewayData.enabled ? "Abierta" : "Cerrada"}
              </span>
            </li>

            <li>
              {paymentGatewayData.enabled ? (
                <>
                  <li>
                    Pasarela abierta:
                    <br /> Desde{" "}
                    <span>
                      {formatToLocalTime(paymentGatewayData.enabled_from)}
                    </span>
                    <br /> Hasta{" "}
                    <span>
                      {formatToLocalTime(paymentGatewayData.enabled_until)}
                    </span>
                  </li>
                  <button onClick={handleClicktogglePaymentGatewayEnable}>
                    Deshabilitar
                  </button>
                </>
              ) : !isEnablingPaymentGateway ? (
                <button onClick={handleClicktogglePaymentGatewayEnable}>
                  Habilitar
                </button>
              ) : (
                <div>
                  <form action="">
                    <label htmlFor="">Desde</label> <input type="date" />
                    <label htmlFor="">Hasta</label>
                    <input type="date" />
                  </form>
                </div>
              )}
            </li>
          </ul>
        ) : (
          <div>No hay información de la pasarela de pago disponible.</div>
        )}
      </section>
    </>
  );
}

export default InfoSection;
