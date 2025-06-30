import { useState, useCallback, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

function useFetch(url, fetchOptions = {}, dependencies = []) {
  const { logout, accessToken } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(url, fetchOptions);
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
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err);
    }
  }, [url, logout, accessToken, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, refetch: fetchData, setData };
}

export default useFetch;
