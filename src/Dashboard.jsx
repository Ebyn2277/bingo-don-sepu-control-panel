import { useState, useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import useFetch from "./hooks/useFetch";
import OrdersSection from "./OrdersSection";
import PaymentGatewaySection from "./PaymentGatewaySection";
import SheetsSection from "./SheetsSection";
import SearchTicketModal from "./SearchTicketModal";
import GameSettingsSection from "./GameSettingsSection";
import "./Dashboard.css";

function Dashboard() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { accessToken, logout } = useContext(AuthContext);
  const [isSearchTicketModalOpen, setIsSearchTicketModalOpen] = useState(false);

  const {
    data: paymentGatewayData,
    setData: setPaymentGatewayData,
    refetch: refetchPaymentGatewayData,
  } = useFetch(
    apiUrl + "api/payment-gateways/1",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
    [accessToken]
  );

  return isSearchTicketModalOpen ? (
    <SearchTicketModal setIsSearchTicketModalOpen={setIsSearchTicketModalOpen} />
  ) : (
    <div className="dashboard-container">
      <button id="logoutButton" onClick={logout}>
        CERRAR SESIÓN
      </button>
      <div className="dashboard">
        <SheetsSection setIsSearchTicketModalOpen={setIsSearchTicketModalOpen} />

        <PaymentGatewaySection
          paymentGatewayData={paymentGatewayData ?? null}
          setPaymentGatewayData={setPaymentGatewayData ?? null}
          refetchPaymentGatewayData={refetchPaymentGatewayData}
        />

        <GameSettingsSection
          paymentGatewayData={paymentGatewayData ?? null}
          setPaymentGatewayData={setPaymentGatewayData ?? null}
        />

        <OrdersSection pricePerSheet={paymentGatewayData?.sheet_price || 0} />
      </div>
    </div>
  );
}

export default Dashboard;