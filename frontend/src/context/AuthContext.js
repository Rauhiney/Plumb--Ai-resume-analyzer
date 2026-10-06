import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user] = useState({
    id: "guest",
    name: "Guest User",
    email: "guest@plumb.local",
    role: "guest",
  });

  const login = useCallback(async () => ({
    id: "guest",
    name: "Guest User",
    email: "guest@plumb.local",
    role: "guest",
  }), []);

  const register = useCallback(async () => ({
    id: "guest",
    name: "Guest User",
    email: "guest@plumb.local",
    role: "guest",
  }), []);

  const logout = useCallback(async () => {
    return null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
