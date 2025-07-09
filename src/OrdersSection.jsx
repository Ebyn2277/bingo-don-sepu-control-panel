import { useState, useRef, useEffect, useContext, useMemo } from "react";
import "./Dashboard.css";
import "./OrdersSection.css";
import { AuthContext } from "./context/AuthContext";
import useFetch from "./hooks/useFetch";
import OrderValidationModal from "./OrderValidationModal";

function OrdersSection({ pricePerSheet }) {
  const { accessToken, logout } = useContext(AuthContext);
  const [tableOrders, setTableOrders] = useState();
  const [searchParam, setSearchParam] = useState("");
  const timeoutRef = useRef();

  const [isValidating, setIsValidating] = useState(false);
  const [validatingOrder, setValidatingOrder] = useState(null);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    }),
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

  useEffect(() => {
    setTableOrders(ordersData);
  }, [ordersData]);

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
          headers,
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

  const handleOnChangeOrdersSearch = (e) => {
    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setSearchParam(e.target.value);
    }, 500);
  };

  useEffect(() => {
    const filteredOrders = ordersData?.filter(
      (order) =>
        order.user_whatsapp.includes(searchParam) ||
        order.user_name.includes(searchParam)
    );

    setTableOrders(filteredOrders);
  }, [searchParam]);

  return (
    <>
      <section className="orders-section">
        <div className="section-header">
          <h2>Órdenes</h2>
          <ul id="header-elements-container">
            <li>
              <input
                type="search"
                name=""
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
                <th>Número de Whatsapp</th>
                <th>Número de Combos</th>
                <th>Combos</th>
                <th>Total Pagado</th>
                <th>Fecha de Compra</th>
                <th>Hora de Compra</th>
                <th>Estado de Validación</th>
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
                    <td className="sheets-container">
                      {order.sheets.map((value, index) => (
                        <a
                          key={`ticket-url-${value.id}`}
                          href={value.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Sheet {index + 1}
                        </a>
                      ))}
                    </td>
                    <td>${(order.sheet_count * pricePerSheet).toFixed(2)}</td>
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
                          ? "Valido"
                          : "No Valido"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No hay órdenes disponibles.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {isValidating && validatingOrder && (
        <OrderValidationModal
          validatingOrder={validatingOrder}
          setIsValidating={setIsValidating}
          pricePerSheet={pricePerSheet}
          validateOrder={validateOrder}
        />
      )}
    </>
  );
}

export default OrdersSection;
