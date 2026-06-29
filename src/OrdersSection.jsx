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

  const { data: sheetsData } = useFetch(
    apiUrl + "api/sheets",
    { method: "GET", headers },
    [accessToken]
  );
  const [currentSheets, setCurrentSheets] = useState([]);

  useEffect(() => {
    setTableOrders(ordersData);
  }, [ordersData]);

  useEffect(() => {
    setCurrentSheets(sheetsData || []);
  }, [sheetsData]);

  const sheetIdToComboNumber = useMemo(() => {
    if (!currentSheets?.length) return new Map();

    const sortedSheets = [...currentSheets].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB || a.id - b.id;
    });

    return new Map(sortedSheets.map((sheet, index) => [sheet.id, index + 1]));
  }, [currentSheets]);

  const getOrderComboNumbers = (order) => {
    if (!order?.sheets?.length) return [];

    return order.sheets
      .map((sheet) => sheetIdToComboNumber.get(sheet.id))
      .filter((comboNumber) => Number.isInteger(comboNumber))
      .sort((a, b) => a - b);
  };

  const formatComboNumbers = (numbers) => {
    if (!numbers?.length) return "";

    const ranges = [];
    let start = numbers[0];
    let end = numbers[0];

    for (let i = 1; i < numbers.length; i++) {
      const current = numbers[i];
      if (current === end + 1) {
        end = current;
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = current;
        end = current;
      }
    }

    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    return ranges.join(", ");
  };

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
    const idx = tableOrders.findIndex((o) => o.id === order.id);

    if (isValidating) {
      if (validatingOrderIndex === idx) return; // already validating this row

      // close current modal then open the new one to create a clear transition
      setIsValidating(false);
      setTimeout(() => {
        setValidatingOrderIndex(idx);
        setIsValidating(true);
      }, 160);
    } else {
      setValidatingOrderIndex(idx);
      setIsValidating(true);
    }
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
                <th>Nombre</th>
                <th>WhatsApp</th>
                <th>Combos</th>
                <th>Cartones</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {tableOrders && tableOrders.length > 0 ? (
                tableOrders.map((order, index) => {
                  const statusLabel =
                    order.payment_proof_validated === null
                      ? "Pendiente"
                      : order.payment_proof_validated
                      ? "Validado"
                      : "No válido";
                  const statusClass =
                    order.payment_proof_validated === null
                      ? "status-pending"
                      : order.payment_proof_validated
                      ? "status-valid"
                      : "status-invalid";

                  return (
                    <tr
                      key={order.id}
                      className={validatingOrderIndex === index ? "selected-row" : ""}
                      onClick={() => handleClickShowValidatingModal(order)}
                    >
                      <td>{order.user_name}</td>
                      <td>{order.user_whatsapp}</td>
                      <td>
                        {formatComboNumbers(getOrderComboNumbers(order)) || order.sheet_count}
                      </td>
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
                      <td>
                        <span className={`order-status ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5">No hay órdenes para el juego actual.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isValidating && validatingOrderIndex !== null && (
        <OrderValidationModal
          validatingOrder={tableOrders[validatingOrderIndex]}
          comboLabel={formatComboNumbers(getOrderComboNumbers(tableOrders[validatingOrderIndex]))}
          setIsValidating={setIsValidating}
          validateOrder={validateOrder}
          deleteOrder={deleteOrder}
        />
      )}
    </>
  );
}

export default OrdersSection;