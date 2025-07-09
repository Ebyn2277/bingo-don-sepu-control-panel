import { useContext, useState, useMemo } from "react";
import "./SearchTicketModal.css";
import { AuthContext } from "./context/AuthContext";
import useFetch from "./hooks/useFetch";

function SearchTicketModal({ setIsSearchTicketModalOpen }) {
  const { accessToken } = useContext(AuthContext);
  // const [tableTickets, setTableTickets] = useState([]);
  const [searchParam, setSearchParam] = useState(null);
  const [searchResults, setSearchResults] = useState(null);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    }),
    [accessToken]
  );

  const { data: ticketsData } = useFetch(
    "http://192.168.20.27:8000/api/tickets",
    {
      method: "GET",
      headers,
    }
  );

  const handleClickCloseSearchTicketModalButton = () => {
    setIsSearchTicketModalOpen(false);
  };

  const handleOnChangeSearchInput = (e) => {
    setSearchParam(e.target.value);

    if (e.target.value.length === 0) {
      setSearchResults(null); // Disable results' table when searchParam is clear
    }
  };

  const handleClickSearchTicketButton = () => {
    const parsedSearchParam = parseInt(searchParam);
    const filteredTickets = ticketsData.filter(
      (ticket) => ticket.id == parsedSearchParam
    );

    setSearchResults(filteredTickets);
  };

  return (
    <div className="search-ticket-modal">
      <div className="modal-header">
        <h2>Buscar cartones</h2>

        <button
          id="cloase-search-ticket-modal-button"
          onClick={handleClickCloseSearchTicketModalButton}
        >
          CERRAR
        </button>
      </div>

      <div className="modal-body">
        <div className="search-actions">
          <input
            type="search"
            id="search-ticket-input"
            placeholder="000000"
            onChange={handleOnChangeSearchInput}
          />
          <button
            id="search-ticket-button"
            onClick={handleClickSearchTicketButton}
          >
            Buscar
          </button>
        </div>

        {searchResults &&
          (searchResults.length === 0 ? (
            <div className="result-message">
              No hay resultados disponibles...
            </div>
          ) : searchResults[0].user_name === null &&
            searchResults[0].user_whatsapp === null ? (
            <div className="result-message">
              Nadie ha comprado este cartón...
            </div>
          ) : (
            <div className="tickets-table-container">
              <table id="tickets-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>WhastApp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr key={searchResults[0].id}>
                    <td>{searchResults[0].user_name}</td>
                    <td>
                      {searchResults[0].user_whatsapp.substring(0, 4)}######
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </div>
  );
}

export default SearchTicketModal;
