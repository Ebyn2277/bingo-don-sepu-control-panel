import { useState, useContext, useEffect } from "react";
import { AuthContext } from "./context/AuthContext";
import "./Dashboard.css";
import "./PaymentGatewaySection.css";

function PaymentGatewaySection({
  paymentGatewayData,
  setPaymentGatewayData,
  refetchPaymentGatewayData,
}) {
  const { accessToken, logout } = useContext(AuthContext);

  const [enabledFrom, setEnabledFrom] = useState("");
  const [enabledUntil, setEnabledUntil] = useState("");
  const [isPaymentGatewayEnabled, setIsPaymentGatewayEnabled] = useState(false);

  const formatToLocalTime = (utcTime) =>
    new Date(utcTime).toLocaleString("es-CO");

  const [isEnablingPaymentGateway, setIsEnablingPaymentGateway] = useState(
    paymentGatewayData ? isPaymentGatewayEnabled : null
  );

  const handleClicktogglePaymentGatewayEnable = async () => {
    setIsEnablingPaymentGateway((prev) => !prev);

    if (isPaymentGatewayEnabled) {
      const updatedPaymentGatewayData = { name: paymentGatewayData.name };
      updatedPaymentGatewayData.enabled_from = null;
      updatedPaymentGatewayData.enabled_until = null;
      updatedPaymentGatewayData.enabled = false;
      console.debug("Enabling platform.");

      updatePaymentGatewayData(updatedPaymentGatewayData);
    }
  };

  useEffect(() => {
    if (!paymentGatewayData) return;

    if (!paymentGatewayData.enabled) {
      setIsPaymentGatewayEnabled(false);
      return;
    }

    let _enabledFrom = new Date(paymentGatewayData.enabled_from);
    let _enabledUntil = new Date(paymentGatewayData.enabled_until);
    let _currentTime = new Date();

    if (
      _enabledFrom.getTime() > _currentTime.getTime() ||
      _currentTime.getTime() > _enabledUntil.getTime()
    ) {
      setIsPaymentGatewayEnabled(false);
      return;
    }

    setIsPaymentGatewayEnabled(true);
  }, [paymentGatewayData]);

  async function updatePaymentGatewayData(updatedPaymentGatewayData) {
    try {
      const response = await fetch(
        "https://protestant-vinni-bingo-don-sepu-66e57ef7.koyeb.app/api/payment-gateways/1",
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
        throw new Error(JSON.stringify(errorData));
      }
      const data = await response.json();
      setPaymentGatewayData(data);
    } catch (error) {
      console.error(error);
      return false;
    }
    return true;
  }

  function hasAtLeastOneDayBetween(date1, date2) {
    const utcStartOfDay1 = new Date(
      Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate())
    );
    const utcStartOfDay2 = new Date(
      Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate())
    );

    const diffMillis = Math.abs(
      utcStartOfDay1.getTime() - utcStartOfDay2.getTime()
    );

    const oneDayMillis = 24 * 60 * 60 * 1000;

    return diffMillis >= oneDayMillis;
  }

  const handleClickOnSubmit = async (e) => {
    e.preventDefault();
    if (!enabledFrom || !enabledUntil) {
      alert(
        "Se deben establecer las fechas en la que estara habilitada la pasarela de pago."
      );
      return;
    }

    const formattedDateEnableFrom = new Date(enabledFrom + "T00:00:00");
    const formattedDateEnabledUntil = new Date(enabledUntil + "T00:00:00");

    if (
      formattedDateEnableFrom.getTime() > formattedDateEnabledUntil.getTime()
    ) {
      alert(
        "Datos invalidos para habilitar la pasarela de pago. La fecha de inicio no puede ser mayor que la fecha final."
      );
      return;
    }

    if (
      !hasAtLeastOneDayBetween(
        formattedDateEnableFrom,
        formattedDateEnabledUntil
      )
    ) {
      alert(
        "Datos invalidos para habilitar la pasarela de pago. Debe haber por lo menos un día entre la fecha de inicio y la fecha final."
      );
      return;
    }

    const updatedPaymentGatewayData = { name: paymentGatewayData.name };
    updatedPaymentGatewayData.enabled_from = formattedDateEnableFrom;
    updatedPaymentGatewayData.enabled_until = formattedDateEnabledUntil;
    updatedPaymentGatewayData.enabled = true;

    handleClicktogglePaymentGatewayEnable();

    updatePaymentGatewayData(updatedPaymentGatewayData);
  };

  const handleOnChangeEnabledFrom = (e) => {
    console.log("datesOnChange");
    setEnabledFrom(e.target.value);
  };

  const handleOnChangeEnabledUntil = (e) => {
    console.log("datesOnChange");
    setEnabledUntil(e.target.value);
  };
  return (
    <section className="payment-gateway-section">
      <div className="section-header">
        <h2>Pasarela de Pago</h2>
        <button
          id="refetchPaymentGatewayData"
          onClick={refetchPaymentGatewayData}
        >
          Actualizar
        </button>
      </div>
      {paymentGatewayData ? (
        <ul>
          <li>
            Estado de la pasarela de pago:{" "}
            <span id="payment-gateway-status">
              {isPaymentGatewayEnabled ? "Abierta" : "Cerrada"}
            </span>
          </li>

          {paymentGatewayData.enabled_from &&
            paymentGatewayData.enabled_until && (
              <li id="enabled-dates">
                <p>
                  {isPaymentGatewayEnabled
                    ? "Pasarela abierta..."
                    : new Date().getTime() >
                      new Date(paymentGatewayData.enabled_until).getTime()
                    ? "La pasarela se abrió..."
                    : "La pasarela se abrirá..."}
                </p>
                <p>
                  ...desde el
                  <span>
                    {formatToLocalTime(paymentGatewayData.enabled_from)}
                  </span>
                </p>
                <p>
                  ...hasta el
                  <span>
                    {formatToLocalTime(paymentGatewayData.enabled_until)}
                  </span>
                </p>
              </li>
            )}

          <li id="enabled-functions">
            {isPaymentGatewayEnabled ? (
              <>
                <button onClick={handleClicktogglePaymentGatewayEnable}>
                  Deshabilitar
                </button>
              </>
            ) : !isEnablingPaymentGateway ? (
              <button onClick={handleClicktogglePaymentGatewayEnable}>
                {paymentGatewayData.enabled_from &&
                paymentGatewayData.enabled_until
                  ? "Cambiar fechas hábiles"
                  : "Habilitar"}
              </button>
            ) : (
              <form action="">
                <label htmlFor="">Desde el:</label>{" "}
                <input
                  type="date"
                  value={enabledFrom}
                  onChange={handleOnChangeEnabledFrom}
                />
                <label htmlFor="">Hasta el:</label>
                <input
                  type="date"
                  value={enabledUntil}
                  onChange={handleOnChangeEnabledUntil}
                />
                <button type="submit" onClick={handleClickOnSubmit}>
                  Habilitar
                </button>
              </form>
            )}
          </li>
        </ul>
      ) : (
        <div>No hay información de la pasarela de pago disponible.</div>
      )}
    </section>
  );
}

export default PaymentGatewaySection;
