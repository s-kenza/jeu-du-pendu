import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Footer from '../Footer';
import Navbar from '../Navbar';
import { useAuth } from '../context/AuthContext';
import ToastNotification from './ToastNotification';
import { CoolMode } from '../cool-mode';
import { WarpBackground } from '../magicui/warp-background';
import { FlipText } from '../magicui/flip-text';

const Layout: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const onSelectMode = (theme: string) => {
    if (theme === 'dark')
      document.documentElement.setAttribute('data-theme', theme)
    else
      document.body.classList.remove('dark-mode')
  }

  useEffect(() => {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => onSelectMode(e.matches ? 'dark' : 'light'));
    onSelectMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', () => {})
    }
  }, [])

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
    <div className="min-h-screen flex flex-col">
        <Navbar />

        <ToastNotification message={toastMessage ?? ''} setMessage={setToastMessage} />

        <main className="flex-grow">
          {isHomePage ? (
        <WarpBackground>
            <div className="flex flex-col items-center justify-center min-h-screen">
              <div className='mb-12'>
              <FlipText
                className="text-8xl font-bold -tracking-widest md:text-7xl md:leading-[5rem]"
                word="Jeu du Pendu"
                delayMultiple={0.08}
              />
              </div>
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
          </WarpBackground>
          ) : (
            <Outlet />
          )}
        </main>

        <Footer />
      </div>
  );
};

export default Layout;