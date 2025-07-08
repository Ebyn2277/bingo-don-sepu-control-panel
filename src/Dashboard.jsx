import { useState, useMemo, useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import useFetch from "./hooks/useFetch";
import OrdersSection from "./OrdersSection";
import OrderValidationModal from "./OrderValidationModal";
import PaymentGatewaySection from "./PaymentGatewaySection";
import SheetsSection from "./SheetsSection";
import "./Dashboard.css";

function Dashboard() {
  const { accessToken, logout } = useContext(AuthContext);
  console.log(accessToken);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    }),
    [accessToken]
  );

  const [isValidating, setIsValidating] = useState(false);
  const [validatingOrder, setValidatingOrder] = useState(null);
  const validateOrder = async (isValid) => {
    if (!validatingOrder) return;

    const updatedOrder = {
      ...validatingOrder,
      payment_proof_validated: isValid,
    };

    try {
      const response = await fetch(
        `http://192.168.20.27:8000/api/orders/${updatedOrder.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
          body: JSON.stringify(updatedOrder),
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
        throw new Error("Failed to fetch data:", errorData, response.status);
      }

      const data = await response.json();
      setValidatingOrder(data);
      refetchOrdersData(); // Refresh orders data after validation
    } catch (error) {
      console.error("Error validating order:", error);
    }
  };

  const handleClickShowValidatingModal = (order) => {
    if (!isValidating) setIsValidating(true);
    setValidatingOrder(order);
  };

  const {
    data: paymentGatewayData,
    setData: setPaymentGatewayData,
    refetch: refetchPaymentGatewayData,
  } = useFetch(
    "http://192.168.20.27:8000/api/payment-gateways/1",
    {
      method: "GET",
      headers,
    },
    [accessToken]
  );

  const { data: sheetsData, refetch: refetchSheetsData } = useFetch(
    "http://192.168.20.27:8000/api/sheets/data",
    {
      method: "GET",
      headers,
    },
    [accessToken]
  );

  const { data: ordersData, refetch: refetchOrdersData } = useFetch(
    "http://192.168.20.27:8000/api/orders",
    {
      method: "GET",
      headers,
    },
    [accessToken]
  );

  return (
    <div className="dashboard-container">
      <button id="logoutButton" onClick={logout}>
        CERRAR SESIÓN
      </button>
      <div className="dashboard">
        <SheetsSection
          availableSheets={sheetsData?.available_sheets_count || 0}
          totalSheets={sheetsData?.last_sheets_submitted_count || 0}
          refetchSheetsData={refetchSheetsData}
        />

        <PaymentGatewaySection
          paymentGatewayData={paymentGatewayData ?? null}
          setPaymentGatewayData={setPaymentGatewayData ?? null}
          refetchPaymentGatewayData={refetchPaymentGatewayData}
        />

        <OrdersSection
          orders={ordersData}
          pricePerSheet={paymentGatewayData?.sheet_price || 0}
          refetchOrdersData={refetchOrdersData}
          handleClickShowValidatingModal={handleClickShowValidatingModal}
        />

        {isValidating && validatingOrder && (
          <OrderValidationModal
            validatingOrder={validatingOrder}
            setIsValidating={setIsValidating}
            pricePerSheet={paymentGatewayData?.sheet_price || 0}
            validateOrder={validateOrder}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
