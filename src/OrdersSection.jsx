import { useState, useRef, useEffect, useContext, useMemo, useCallback } from "react";
import "./Dashboard.css";
import "./OrdersSection.css";
import { AuthContext } from "./context/AuthContext";
import useFetch from "./hooks/useFetch";
import OrderValidationModal from "./OrderValidationModal";
import DownloadCombosModal from "./DownloadCombosModal";

function OrdersSection({ pricePerSheet }) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { accessToken, logout } = useContext(AuthContext);
  const [tableOrders, setTableOrders] = useState();
  const [searchInput, setSearchInput] = useState("");
  const [searchParam, setSearchParam] = useState("");
  const timeoutRef = useRef();

  const [isValidating, setIsValidating] = useState(false);
  const [validatingOrderIndex, setValidatingOrderIndex] = useState(null);
  const [isCompactView, setIsCompactView] = useState(false);

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadOrderIndex, setDownloadOrderIndex] = useState(null);
  const [searchMode, setSearchMode] = useState("text");

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
    setTableOrders(sortOrders(ordersData));
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

  const sortOrders = useCallback(
    (orders) => {
      if (!orders) return orders;

      const statusPriority = (order) =>
        order.payment_proof_validated === null
          ? 0
          : order.payment_proof_validated
          ? 1
          : 2;

      return [...orders].sort((a, b) => {
        const pa = statusPriority(a);
        const pb = statusPriority(b);
        if (pa !== pb) return pa - pb;

        const aCombos = getOrderComboNumbers(a);
        const bCombos = getOrderComboNumbers(b);
        const aMin = aCombos.length ? aCombos[0] : Number.MAX_SAFE_INTEGER;
        const bMin = bCombos.length ? bCombos[0] : Number.MAX_SAFE_INTEGER;
        if (aMin !== bMin) return aMin - bMin;

        return a.id - b.id;
      });
    },
    [sheetIdToComboNumber]
  );

  const renderCompactOrders = () => {
    if (!tableOrders || tableOrders.length === 0) {
      return <div className="compact-empty">No hay órdenes para el juego actual.</div>;
    }

    const compactRows = tableOrders.flatMap((order) => {
      const comboNumbers = getOrderComboNumbers(order);
      if (!comboNumbers.length) {
        return [
          {
            id: `order-${order.id}-no-sheets`,
            comboNumber: "-",
            user_name: order.user_name,
            user_whatsapp: order.user_whatsapp,
          },
        ];
      }

      return comboNumbers.map((comboNumber) => ({
        id: `order-${order.id}-sheet-${comboNumber}`,
        comboNumber,
        user_name: order.user_name,
        user_whatsapp: order.user_whatsapp,
      }));
    });

    return (
      <div className="orders-compact-container">
        {compactRows.map((row) => (
          <div className="orders-compact-row" key={row.id}>
            <span className="compact-combo">#{row.comboNumber}</span>
            <span className="compact-name">{row.user_name}</span>
            <span className="compact-whatsapp">{row.user_whatsapp}</span>
          </div>
        ))}
      </div>
    );
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
      setIsValidating(false);
      setValidatingOrderIndex(null);
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

  const handleClickShowDownloadModal = (order) => {
    const idx = tableOrders.findIndex((o) => o.id === order.id);

    if (isDownloadModalOpen) {
      if (downloadOrderIndex === idx) return;
      setIsDownloadModalOpen(false);
      setTimeout(() => {
        setDownloadOrderIndex(idx);
        setIsDownloadModalOpen(true);
      }, 160);
    } else {
      setDownloadOrderIndex(idx);
      setIsDownloadModalOpen(true);
    }
  };

  const handleOnChangeOrdersSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSearchParam(value);
    }, 500);
  };

  const toggleSearchMode = () => {
    setSearchMode((current) => (current === "text" ? "combo" : "text"));
    setSearchInput("");
    setSearchParam("");
  };

  useEffect(() => {
    if (!ordersData) return;
    const param = searchParam.trim();
    const isNum = /^\d+$/.test(param);
    const parsedNum = isNum ? parseInt(param, 10) : null;

    const filtered = ordersData.filter((order) => {
      if (!param) return true;
      if (searchMode === "combo") {
        if (!isNum) return false;
        const combos = getOrderComboNumbers(order);
        return combos.includes(parsedNum);
      }

      return (
        order.user_whatsapp.includes(param) || order.user_name.includes(param)
      );
    });

    setTableOrders(sortOrders(filtered));
  }, [searchParam, ordersData, sortOrders, searchMode]);

  // Auto-refetch orders data periodically (every 8 seconds)
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      refetchOrdersData();
    }, 8000);
    
    return () => clearInterval(autoRefreshInterval);
  }, []); // Empty dependency array - interval is always created

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
                placeholder={
                  searchMode === "combo"
                    ? "Buscar combo..."
                    : "Buscar... (WhatsApp/Nombre)"
                }
                value={searchInput}
                onChange={handleOnChangeOrdersSearch}
              />
            </li>
            <li>
              <button type="button" id="toggleSearchMode" onClick={toggleSearchMode}>
                Buscar por {searchMode === "combo" ? "WhatsApp/Nombre" : "Combo"}
              </button>
            </li>
            <li>
              <button
                id="toggleOrdersView"
                onClick={() => {
                  setIsCompactView((current) => !current);
                  if (!isCompactView) {
                    setIsValidating(false);
                    setValidatingOrderIndex(null);
                  }
                }}
              >
                {isCompactView ? "Vista normal" : "Vista comprimida"}
              </button>
            </li>
            <li>
              <button id="refreshOrders" onClick={refetchOrdersData}>
                Actualizar
              </button>
            </li>
          </ul>
        </div>

        <div id="orders-table-container">
          {isCompactView ? (
            renderCompactOrders()
          ) : (
            <table id="orders-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>WhatsApp</th>
                  <th>Combos</th>
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
                        className={
                          validatingOrderIndex === index ? "selected-row" : ""
                        }
                        onClick={() => handleClickShowValidatingModal(order)}
                      >
                        <td>{order.user_name}</td>
                        <td>{order.user_whatsapp}</td>
                        <td onClick={(e) => { e.stopPropagation(); handleClickShowDownloadModal(order); }} style={{ cursor: 'pointer' }}>
                          {formatComboNumbers(getOrderComboNumbers(order)) ||
                            order.sheet_count}
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
                    <td colSpan="4">No hay órdenes para el juego actual.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {isValidating && validatingOrderIndex !== null && (
        <OrderValidationModal
          validatingOrder={tableOrders[validatingOrderIndex]}
          comboLabel={formatComboNumbers(getOrderComboNumbers(tableOrders[validatingOrderIndex]))}
          orderComboNumbers={getOrderComboNumbers(tableOrders[validatingOrderIndex])}
          setIsValidating={setIsValidating}
          validateOrder={validateOrder}
          deleteOrder={deleteOrder}
        />
      )}

      {isDownloadModalOpen && downloadOrderIndex !== null && (
        <DownloadCombosModal
          order={tableOrders[downloadOrderIndex]}
          setIsOpen={setIsDownloadModalOpen}
          orderComboNumbers={getOrderComboNumbers(tableOrders[downloadOrderIndex])}
        />
      )}
    </>
  );
}

export default OrdersSection;