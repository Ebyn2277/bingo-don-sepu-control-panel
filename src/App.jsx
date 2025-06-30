import "./App.css";
import { useContext } from "react";
import Login from "./Login";
import { AuthContext } from "./context/AuthContext";
import Dashboard from "./Dashboard";

function App() {
  const { isLoggedIn, accessToken } = useContext(AuthContext);

  return <>{!isLoggedIn && !accessToken ? <Login /> : <Dashboard />}</>;
}

export default App;
