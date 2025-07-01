import { AuthContext } from "./context/AuthContext";
import "./Dashboard.css";
import "./TicketsSection.css";
import { useContext, useState, useRef, useEffect } from "react";

function TicketsSection({
  availableTickets,
  totalTickets,
  refetchTicketsData,
}) {
  const { accessToken, logout } = useContext(AuthContext);
  const [isUploadingTickets, setIsUploadingTickets] = useState(false);
  const [file, setFile] = useState(null);
  const [invalidate_previous, setInvalidatePrevious] = useState(true);
  const [isProcessingTickets, setIsProcessingTickets] = useState(false);
  const [initialUnprocessedTicketsCount, setInitialUnprocessedTicketsCount] =
    useState(null);
  const [uploadedTicketsCount, setUploadedTicketsCount] = useState(null);
  const fileInputRef = useRef(null);

  const handleClickUploadTickets = () => {
    setIsUploadingTickets(true);
  };

  const handleOnChangeTicketsFile = (e) => {
    setFile(e.target.files[0]);
  };

  const handleOnSubmitUploadTicketsForm = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("invalidate_previous", invalidate_previous ? 1 : 0);

      const response = await fetch("http://localhost:8000/api/tickets/upload", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });
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
      setIsProcessingTickets(true);
      setIsUploadingTickets(false);
      if (!invalidate_previous) setInvalidatePrevious(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setInitialUnprocessedTicketsCount(data.tickets_count);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    initialUnprocessedTicketsCount !== null && fetchProcessingTicketsState();
  }, [initialUnprocessedTicketsCount]);

  const fetchProcessingTicketsState = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/tickets/uploading-status",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
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
      const tempUnprocessedTicketsCount = data.pending_jobs;
      const tempUploadedTicketsCount =
        initialUnprocessedTicketsCount - tempUnprocessedTicketsCount;

      setUploadedTicketsCount(tempUploadedTicketsCount);

      if (tempUnprocessedTicketsCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        fetchProcessingTicketsState();
      } else {
        setInitialUnprocessedTicketsCount(null);
        setUploadedTicketsCount(null);
        setIsProcessingTickets(false);
        await refetchTicketsData();
      }
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <section className="tickets-section">
      <div className="section-header">
        <h2>Combos</h2>
        <button
          id="refetchTicketsData"
          onClick={async () => {
            await refetchTicketsData();
          }}
        >
          Actualizar
        </button>
      </div>
      <ul id="info-container">
        <li>
          <p>Número de combos disponibles:</p>
          <span>
            {availableTickets} / {totalTickets}
          </span>
        </li>
        <li>
          <p>Número de combos vendidos:</p>
          <span>
            {totalTickets - availableTickets} / {totalTickets}
          </span>
        </li>
      </ul>

      {!isProcessingTickets &&
        (!isUploadingTickets ? (
          <button
            className="upload-tickets-button"
            onClick={handleClickUploadTickets}
          >
            SUBIR COMBOS
          </button>
        ) : (
          <form
            id="upload-tickets-form"
            onSubmit={handleOnSubmitUploadTicketsForm}
          >
            <label for="tickets-file">Selecciona un archivo</label>
            <input
              id="tickets-file"
              type="file"
              accept=".pdf"
              form="upload-tickets-form"
              ref={fileInputRef}
              required
              onChange={handleOnChangeTicketsFile}
            />
            <button
              className={`confirm-upload-tickets-button ${
                file ? "enabled" : "disabled"
              }`}
              type="submit"
              form="upload-tickets-form"
            >
              SUBIR
            </button>
          </form>
        ))}

      {isProcessingTickets && (
        <div className="processing-tickets-state-container">
          Processando Tickets:{" "}
          <span>
            {uploadedTicketsCount ?? 0} / {initialUnprocessedTicketsCount ?? 0}
          </span>
        </div>
      )}
    </section>
  );
}

export default TicketsSection;
