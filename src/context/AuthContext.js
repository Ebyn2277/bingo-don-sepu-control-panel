import React from "react";

export const AuthContext = React.createContext({
  isLoggedIn: false,
  accessToken: null,
  login: async (email, password) => {},
  logout: async () => {},
});
