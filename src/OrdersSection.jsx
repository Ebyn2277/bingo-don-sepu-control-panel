import { useState, useRef, useEffect, useContext, useMemo } from "react";
import "./Dashboard.css";
import "./OrdersSection.css";
import { AuthContext } from "./context/AuthContext";
import useFetch from "./hooks/useFetch";
import OrderValidationModal from "./OrderValidationModal";

function OrdersSection({ pricePerSheet }) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { accessToken, logout } = useContext(AuthContext);
  const [tableOrders, setTableOrders] = useState();
  const [searchParam, setSearchParam] = useState("");
  const timeoutRef = useRef();

  const [isValidating, setIsValidating] = useState(false);
  const [validatingOrderIndex, setValidatingOrderIndex] = useState(null);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    }),
    [accessToken]
  );

  const { data: ordersData, refetch: refetchOrdersData } = useFetch(
    apiUrl + "api/orders",
    { method: "GET", headers },
    [accessToken]
  );

  useEffect(() => {
    setTableOrders(ordersData);
  }, [ordersData]);

  // Sends PUT /orders/{id} with the full order + updated validation field.
  // Accepts true (valid), false (invalid), or null (reset to pending).
  const validateOrder = async (isValid) => {
    if (validatingOrderIndex === null) return;

    const updatedOrder = {
      ...tableOrders[validatingOrderIndex],
      payment_proof_validated: isValid,
    };

    try {
      const response = await fetch(
        `${apiUrl}api/orders/${updatedOrder.id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(updatedOrder),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 && errorData.message === "Unauthenticated.") {
          logout();
          return;
        }
        throw new Error(errorData.message || "Error al validar la orden.");
      }

      await refetchOrdersData();
    } catch (error) {
      console.error("Error validating order:", error);
      alert("Error al actualizar el estado de la orden.");
    }
  };

  // Sends DELETE /orders/{id} — frees sheets, closes modal on success.
  const deleteOrder = async (orderId) => {
    try {
      const response = await fetch(
        `${apiUrl}api/orders/${orderId}`,
        { method: "DELETE", headers }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 && errorData.message === "Unauthenticated.") {
          logout();
          return;
        }
        throw new Error(errorData.error || "Error al eliminar la reserva.");
      }

      setIsValidating(false);
      setValidatingOrderIndex(null);
      await refetchOrdersData();
    } catch (error) {
      console.error("Error deleting order:", error);
      alert(error.message);
    }
  };

  const handleClickShowValidatingModal = (order) => {
    setIsValidating(true);
    setValidatingOrderIndex(tableOrders.findIndex((o) => o.id === order.id));
  };

  const handleOnChangeOrdersSearch = (e) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSearchParam(e.target.value);
    }, 500);
  };

  useEffect(() => {
    if (!ordersData) return;
    const filtered = ordersData.filter(
      (order) =>
        order.user_whatsapp.includes(searchParam) ||
        order.user_name.includes(searchParam)
    );
    setTableOrders(filtered);
  }, [searchParam, ordersData]);

  return (
    <>
      <section className="orders-section">
        <div className="section-header">
          <h2>Órdenes</h2>
          <ul id="header-elements-container">
            <li>
              <input
                type="search"
                id="orders-search"
                placeholder="Buscar... (WhatsApp/Nombre)"
                onChange={handleOnChangeOrdersSearch}
              />
            </li>
            <li>
              <button id="refreshOrders" onClick={refetchOrdersData}>
                Actualizar
              </button>
            </li>
          </ul>
        </div>

        <div id="orders-table-container">
          <table id="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>WhatsApp</th>
                <th>Combos</th>
                <th>Cartones (tickets)</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Validación</th>
              </tr>
            </thead>
            <tbody>
              {tableOrders && tableOrders.length > 0 ? (
                tableOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.user_name}</td>
                    <td>{order.user_whatsapp}</td>
                    <td>{order.sheet_count}</td>
                    <td className="tickets-container">
                      <ul>
                        {order.sheets?.map((sheet) => (
                          <li key={sheet.id}>
                            <a
                              href={sheet.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {sheet.tickets?.map((t) => t.id).join(", ")}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>${order.total_amount.toFixed(2)}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>{new Date(order.created_at).toLocaleTimeString()}</td>
                    <td>
                      <button
                        className={`validate-button ${
                          order.payment_proof_validated === null
                            ? "pendiente"
                            : order.payment_proof_validated
                            ? "valido"
                            : "no-valido"
                        }`}
                        onClick={() => handleClickShowValidatingModal(order)}
                      >
                        {order.payment_proof_validated === null
                          ? "Pendiente"
                          : order.payment_proof_validated
                          ? "Válido"
                          : "No válido"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No hay órdenes para el juego actual.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isValidating && validatingOrderIndex !== null && (
        <OrderValidationModal
          validatingOrder={tableOrders[validatingOrderIndex]}
          tableOrdersLength={tableOrders.length}
          setValidatingOrderIndex={setValidatingOrderIndex}
          setIsValidating={setIsValidating}
          pricePerSheet={pricePerSheet}
          validateOrder={validateOrder}
          deleteOrder={deleteOrder}
        />
      )}
    </>
  );
}

export default OrdersSection;