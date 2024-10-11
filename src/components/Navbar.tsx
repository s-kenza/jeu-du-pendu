import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Navbar = () => {
    const [open, setOpen] = useState(false); // Gère l'état d'ouverture du menu
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const location = useLocation(); // Récupère l'URL actuelle pour surveiller les changements de navigation
    const navigate = useNavigate(); // Permet de naviguer via React Router

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleToggle = (e: any) => {
        setOpen(e.target.open); // Synchronise l'état avec l'ouverture/fermeture du menu
    };

    const handleLinkClick = (path: any) => {
        if (location.pathname === path) {
            // Si on est déjà sur la page, on ferme simplement le menu
            setOpen(false);
        } else {
            // Si on est sur une autre page, on navigue vers la nouvelle route et ferme le menu
            navigate(path);
            setOpen(false);
        }
    };

    const handleLogout = () => {
        // Supprime le token du localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        // Redirige vers la page d'accueil ou de connexion
        navigate('/login'); // ou navigate('/') pour rediriger vers la page d'accueil
    };

    useEffect(() => {
        // Ferme le menu lorsque la page change (lors de la navigation)
        setOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return (
        <div className="navbar bg-base-200">
            <div className="flex-1">
                <a className="btn btn-ghost text-xl">Le Jeu de Kenza</a>
            </div>
            <div className="flex-none">
                <ul className="menu menu-horizontal px-1">
                    <button onClick={toggleTheme} className="mr-4">
                        {theme === 'light' ? '🌙' : '🌞'}
                    </button>
                    <li>
                        <Link to="/">
                          <button>
                              Accueil
                          </button>
                        </Link>
                    </li>
                    <li>
                        <details open={open} onToggle={handleToggle}>
                            <summary>Mon compte</summary>
                            <ul className="bg-base-100 rounded-t-none p-2">
                                <li>
                                    <button 
                                        className="mr-4" 
                                        onClick={() => handleLinkClick('/login')}>
                                        Connexion
                                    </button>
                                </li>
                                <li>
                                    <button 
                                        onClick={() => handleLinkClick('/register')}>
                                        Inscription
                                    </button>
                                </li>
                                <li>
                                  <button 
                                      onClick={handleLogout}>
                                      Déconnexion
                                  </button>
                                </li>
                            </ul>
                        </details>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Navbar;
