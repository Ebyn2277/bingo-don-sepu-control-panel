import { AuthContext } from "./context/AuthContext";
import "./Dashboard.css";
import "./SheetsSection.css";
import { useContext, useState, useRef, useEffect, useMemo } from "react";
import useFetch from "./hooks/useFetch";

function SheetsSection({ setIsSearchTicketModalOpen }) {
  const { accessToken, logout } = useContext(AuthContext);
  const [isUploadingSheets, setIsUploadingSheets] = useState(false);
  const [file, setFile] = useState(null);
  const [firstTicketId, setFirstTicketId] = useState(0);
  const [shouldInvalidatePrevious, setShouldInvalidatePrevious] =
    useState(true);
  const [isProcessingSheets, setIsProcessingSheets] = useState(false);
  const [initialUnprocessedSheetsCount, setInitialUnprocessedSheetsCount] =
    useState(null);
  const [uploadedSheetsCount, setUploadedSheetsCount] = useState(null);
  const fileInputRef = useRef(null);
  const [availableSheets, setAvailableSheets] = useState(null);
  const [totalSheets, setTotalSheets] = useState(null);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    }),
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

  useEffect(() => {
    setAvailableSheets(sheetsData?.available_sheets_count ?? 0);
    setTotalSheets(sheetsData?.last_sheets_submitted_count ?? 0);
  }, [sheetsData]);

  const handleClickUploadSheets = () => {
    setIsUploadingSheets(true);
  };

  const handleClickOpenSearchModal = () => {
    setIsSearchTicketModalOpen(true);
  };

  const handleOnChangeSheetsFile = (e) => {
    setFile(e.target.files[0]);
  };

  const handleOnChangeFirstTicetId = (e) => {
    setFirstTicketId(parseInt(e.target.value));
  };

  const handleOnSubmitUploadSheetsForm = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("invalidate_previous", shouldInvalidatePrevious ? 1 : 0);
      formData.append("first_ticket_id", firstTicketId);

      const response = await fetch(
        "http://192.168.20.27:8000/api/sheets/upload",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
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
      console.log(data);
      setIsProcessingSheets(true);
      setIsUploadingSheets(false);
      if (!shouldInvalidatePrevious) setShouldInvalidatePrevious(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setInitialUnprocessedSheetsCount(data.sheets_count);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    initialUnprocessedSheetsCount !== null && fetchProcessingSheetsState();
  }, [initialUnprocessedSheetsCount]);

  const fetchProcessingSheetsState = async () => {
    try {
      const response = await fetch(
        "http://192.168.20.27:8000/api/sheets/uploading-status",
        {
          method: "GET",
          headers,
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
      const tempUnprocessedSheetsCount = data.pending_jobs;
      const tempUploadedSheetsCount =
        initialUnprocessedSheetsCount - tempUnprocessedSheetsCount;

      setUploadedSheetsCount(tempUploadedSheetsCount);

      if (tempUnprocessedSheetsCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        fetchProcessingSheetsState();
      } else {
        setInitialUnprocessedSheetsCount(null);
        setUploadedSheetsCount(null);
        setIsProcessingSheets(false);
        await refetchSheetsData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className="sheets-section">
      <div className="section-header">
        <h2>Combos</h2>
        <button
          id="refetchSheetsData"
          onClick={async () => {
            await refetchSheetsData();
          }}
        >
          Actualizar
        </button>
      </div>
      <ul id="info-container">
        <li>
          <p>Número de combos disponibles:</p>
          <span>
            {availableSheets} / {totalSheets}
          </span>
        </li>
        <li>
          <p>Número de combos vendidos:</p>
          <span>
            {totalSheets - availableSheets} / {totalSheets}
          </span>
        </li>
      </ul>

      {!isProcessingSheets &&
        (!isUploadingSheets ? (
          <div className="sheet-actions">
            <button
              className="upload-sheets-button"
              onClick={handleClickUploadSheets}
            >
              Subir
            </button>
            <button
              className="open-search-modal-button"
              onClick={handleClickOpenSearchModal}
            >
              Buscar
            </button>
          </div>
        ) : (
          <form
            id="upload-sheets-form"
            onSubmit={handleOnSubmitUploadSheetsForm}
          >
            <label for="sheets-first-ticket-id">ID del primer cartón:</label>
            <input
              id="sheets-first-ticket-id"
              type="number"
              onChange={handleOnChangeFirstTicetId}
              min={1}
              required
            />
            <label
              id="file-label"
              for="sheets-file"
              className={`${file && "label-disabled"}`}
            >
              Selecciona un archivo
            </label>
            <input
              id="sheets-file"
              type="file"
              accept=".pdf"
              form="upload-sheets-form"
              ref={fileInputRef}
              required
              className={`${
                file && file !== "" ? "input-enabled" : "input-disabled"
              }`}
              onChange={handleOnChangeSheetsFile}
            />
            <button
              className={`confirm-upload-sheets-button ${
                file ? "enabled" : "disabled"
              }`}
              type="submit"
              form="upload-sheets-form"
            >
              Subir
            </button>
          </form>
        ))}

      {isProcessingSheets && (
        <div className="processing-sheets-state-container">
          <p>Combos Subidos:</p>
          <span>
            {uploadedSheetsCount ?? 0} / {initialUnprocessedSheetsCount ?? 0}
          </span>
        </div>
      )}
    </section>
  );
}

export default SheetsSection;
