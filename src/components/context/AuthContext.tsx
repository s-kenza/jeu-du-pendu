import React, { createContext, useState, useEffect, useContext } from 'react';
import { io, Socket } from "socket.io-client";

// Types pour AuthContext
interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  socket: Socket | null;
  login: (token: string, userId: string) => void;
  logout: (userId: string) => void;
}

// Création du contexte avec une valeur par défaut
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fournisseur d'authentification
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null); // Stocker le socket
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Fonction pour gérer la connexion
  const login = (token: string, userId: string) => {
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('userId', userId);
    setIsAuthenticated(true);
    setUserId(userId);

    const newSocket = io(`${API_URL}`, { auth: { token } });

    setSocket(newSocket);
  };

  // Fonction pour gérer la déconnexion
  const logout = (userId: string) => {
    if (socket) {
      socket.disconnect();
      socket.emit('disconnected', userId);
      setSocket(null);
    }
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('toastShown');
    sessionStorage.removeItem('roomId');
    setIsAuthenticated(false);
    setUserId(null);
  };


  // Vérification de l'authentification au chargement de l'application
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    const storedUserId = sessionStorage.getItem('userId');
  
    if (token && token.trim() !== "") {
      setIsAuthenticated(true);
      setUserId(storedUserId);

      const newSocket = io(`${API_URL}`, { auth: { token } });
      setSocket(newSocket);
    } else {
      setIsAuthenticated(false);
      setUserId(null);
      if(socket) {
        socket.disconnect();
      }
    }
  }, []);  

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, socket, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser AuthContext facilement
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};