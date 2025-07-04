import { useState, useEffect, useCallback, useMemo } from "react";
import { AuthContext } from "./AuthContext";

function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("access_token")
  );

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch("http://192.168.20.27:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      const { access_token } = data;
      localStorage.setItem("access_token", access_token);
      setAccessToken(access_token);
      setIsLoggedIn(true);
      console.log("Login successful");
    } catch (error) {
      console.error("Error during login:", error);
      alert("Login failed. Please check your credentials.");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        const response = await fetch("http://192.168.20.27:8000/api/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!response.ok) {
          const data = await response.json();
          if (data.message) {
            console.error("Logout error:", data.message);
          }
          throw new Error("Logout failed");
        }
        console.log("Logout successful");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Hubo un fallo al cerrar sessión. Por favor, intentelo de nuevo.");
    } finally {
      localStorage.removeItem("access_token");
      setAccessToken(null);
      setIsLoggedIn(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem("access_token");
    if (storedAccessToken) {
      setAccessToken(storedAccessToken);
      setIsLoggedIn(true);
    } else {
      setAccessToken(null);
      setIsLoggedIn(false);
      console.log("No access token found in localStorage.");
    }
  }, [logout]);

  const authContextValue = useMemo(
    () => ({
      isLoggedIn,
      accessToken,
      login,
      logout,
    }),
    [isLoggedIn, accessToken, login, logout]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
