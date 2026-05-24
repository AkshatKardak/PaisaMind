import { createContext, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("paisamind_token"));
  const [loading, setLoading] = useState(true);

  const handleAuthSuccess = ({ token: nextToken, user: nextUser }) => {
    localStorage.setItem("paisamind_token", nextToken);
    localStorage.setItem("paisamind_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const login = async (payload) => {
    const response = await authService.login(payload);
    handleAuthSuccess(response);
    return response;
  };

  const register = async (payload) => {
    const response = await authService.register(payload);
    handleAuthSuccess(response);
    return response;
  };

  const logout = () => {
    localStorage.removeItem("paisamind_token");
    localStorage.removeItem("paisamind_user");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem("paisamind_token");
      const storedUser = localStorage.getItem("paisamind_user");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("paisamind_user");
        }
      }

      try {
        const response = await authService.getMe();
        setUser(response.user);
        localStorage.setItem("paisamind_user", JSON.stringify(response.user));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      setUser,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
