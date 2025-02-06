import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";

const Navbar = () => {
    const [open, setOpen] = useState(false); // Gère l'état d'ouverture du menu
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const location = useLocation(); // Récupère l'URL actuelle pour surveiller les changements de navigation
    const navigate = useNavigate(); // Permet de naviguer via React Router
    const { isAuthenticated, logout, userId } = useAuth();

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
        // Supprime le token du sessionStorage
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        // Redirige vers la page d'accueil ou de connexion
        navigate('/');
        // Déconnecte l'utilisateur
        logout(userId || '');
    };

    useEffect(() => {
        // Ferme le menu lorsque la page change (lors de la navigation)
        setOpen(false);
        console.log("Navbar:", isAuthenticated)
        document.documentElement.setAttribute('data-theme', theme);
    }, [location.pathname, theme]);

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
                    {isAuthenticated ? (
                        <>
                            <li>
                                <details open={open} onToggle={handleToggle}>
                                    <summary>Mon profil</summary>
                                    <ul className="bg-base-100 rounded-t-none p-2">
                                        <li>
                                            <button>
                                                Paramètres
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
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/login">
                                <button>
                                    Connexion
                                </button>
                                </Link>
                            </li>
                            <li>
                                <Link to="/register">
                                <button>
                                    Inscription
                                </button>
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Navbar;
