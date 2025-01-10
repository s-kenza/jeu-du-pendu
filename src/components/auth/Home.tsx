import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Footer from '../Footer';
import Navbar from '../Navbar';
import { useAuth } from '../context/AuthContext';
import ToastNotification from './ToastNotification';
import { SocketProvider } from '../context/SocketContext';

const Layout: React.FC = () => {
  
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    if (location.state?.message) {
      setToastMessage(location.state.message); // Affiche le message de toast
    }
    console.log("Authentifié:", isAuthenticated);
  }, [location.state, isAuthenticated]);

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <ToastNotification message={toastMessage} setMessage={setToastMessage} />

        <main className="flex-grow">
        {isHomePage ? (
            (
              <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-4xl font-bold mb-4">Jeu du Pendu</h1>
                <p className="text-lg mb-6 text-center max-w-lg">
                  Bienvenue dans le jeu du pendu ! Testez vos compétences en devinant les mots choisis par le système. 
                  Amusez-vous tout en apprenant de nouveaux mots !
                </p>
                { isAuthenticated ? (
                  <Link to="/game">
                    <button className="btn btn-primary text-white bg-blue-600 hover:bg-blue-700 transition duration-300">
                      Jouer
                      </button>
                  </Link>
                      ) : (    
                  <Link to="/login">
                    <button className="btn btn-primary text-white bg-blue-600 hover:bg-blue-700 transition duration-300">
                      Commencer le Jeu
                    </button>
                  </Link>
                  )}
              </div>
            )
          ) : (
            <Outlet />
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Layout;
