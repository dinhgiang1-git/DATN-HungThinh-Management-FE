import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

function getSavedAuth() {
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');

  if (!savedToken || !savedUser) {
    return { token: null, user: null };
  }

  try {
    const parsedUser = JSON.parse(savedUser);
    if (!parsedUser?.id) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { token: null, user: null };
    }
    return { token: savedToken, user: parsedUser };
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getSavedAuth);
  const loading = false;

  const { user, token } = auth;

  const login = (userData, authToken) => {
    setAuth({ user: userData, token: authToken });
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setAuth({ user: null, token: null });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
