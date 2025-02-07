import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Footer from '../Footer';
import Navbar from '../Navbar';
import { useAuth } from '../context/AuthContext';
import ToastNotification from './ToastNotification';
import { CoolMode } from '../cool-mode';

const Layout: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    // Vérifier si un message est passé dans l'état de navigation et s'il n'a pas déjà été affiché
    if (location.state?.message && !sessionStorage.getItem('toastShown')) {
      setToastMessage(location.state.message);
      sessionStorage.setItem('toastShown', 'true');
    }
    console.log('Authentifié:', isAuthenticated);
  }, [location.state, isAuthenticated]);

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <ToastNotification message={toastMessage} setMessage={setToastMessage} />

        <main className="flex-grow">
          {isHomePage ? (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <h1 className="text-4xl font-bold mb-4">Jeu du Pendu</h1>
              <p className="text-lg mb-6 text-center max-w-lg">
                Bienvenue dans le jeu du pendu ! Testez vos compétences en devinant les mots choisis par le système. 
                Amusez-vous tout en apprenant de nouveaux mots !
              </p>
              {isAuthenticated ? (
                <Link to="/game">
                  <CoolMode>
                    <button className="btn btn-primary text-white bg-blue-600 hover:bg-blue-700 transition duration-300">
                      Jouer
                    </button>
                  </CoolMode>
                </Link>
              ) : (
                <Link to="/login">
                  <button className="btn btn-primary text-white bg-blue-600 hover:bg-blue-700 transition duration-300">
                    Commencer le Jeu
                  </button>
                </Link>
              )}
            </div>
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