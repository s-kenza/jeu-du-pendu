import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from "socket.io-client";

// Types pour AuthContext
interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  login: (token: string, userId: string) => void;
  logout: (userId: string) => void;
}

// Création du contexte avec une valeur par défaut
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Connexion au serveur WebSocket
const socket = io("http://localhost:3000"); 

// Fournisseur d'authentification
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fonction pour gérer la connexion
  const login = (token: string, userId: string) => {
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('userId', userId);
    setIsAuthenticated(true);
    setUserId(userId);
  };

  // Fonction pour gérer la déconnexion
  const logout = (userId: string) => {
    socket.disconnect();
    socket.emit('disconnected', userId);
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
    } else {
      setIsAuthenticated(false);
      setUserId(null);
      socket.disconnect();
    }
  }, []);  

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, login, logout}}>
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