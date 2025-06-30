import { useState, useMemo, useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import useFetch from "./hooks/useFetch";
import InfoSection from "./InfoSection";
import OrdersSection from "./OrdersSection";
import OrderValidationModal from "./OrderValidationModal";

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
        `http://localhost:8000/api/orders/${updatedOrder.id}`,
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
          console.error("Validation error:", errorData.message);
          if (
            errorData.status === 401 &&
            errorData.message === "Unauthenticated."
          ) {
            logout();
            return;
          }
        }
        throw new Error("Failed to validate order");
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
    "http://localhost:8000/api/payment-gateways/1",
    {
      method: "GET",
      headers,
    },
    [accessToken]
  );

  const { data: ticketsData, refetch: refetchTicketsData } = useFetch(
    "http://localhost:8000/api/tickets/data",
    {
      method: "GET",
      headers,
    },
    [accessToken]
  );

  const { data: ordersData, refetch: refetchOrdersData } = useFetch(
    "http://localhost:8000/api/orders",
    {
      method: "GET",
      headers,
    },
    [accessToken]
  );

  return (
    <>
      <div className="app-container">
        <button onClick={logout}>Cerrar sesión</button>

        <InfoSection
          availableTickets={ticketsData?.available_tickets_count || 0}
          totalTickets={ticketsData?.last_tickets_submitted_count || 0}
          paymentGatewayData={paymentGatewayData ?? null}
          setPaymentGatewayData={setPaymentGatewayData ?? null}
          refetchTicketsData={refetchTicketsData}
          refetchPaymentGatewayData={refetchPaymentGatewayData}
        />

        <OrdersSection
          orders={ordersData}
          pricePerTicket={paymentGatewayData?.ticket_price || 0}
          refetchOrdersData={refetchOrdersData}
          handleClickShowValidatingModal={handleClickShowValidatingModal}
        />

        {isValidating && validatingOrder && (
          <OrderValidationModal
            validatingOrder={validatingOrder}
            setIsValidating={setIsValidating}
            pricePerTicket={paymentGatewayData?.ticket_price || 0}
            validateOrder={validateOrder}
          />
        )}
      </div>
    </>
  );
}

export default Dashboard;
