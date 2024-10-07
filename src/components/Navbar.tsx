import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const Navbar = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    };
  
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
          {theme === 'light' ? '🌞' : '🌙'}
          </button>
          <li><a>Accueil</a></li>
          <li>
            <details>
              <summary>Parent</summary>
              <ul className="bg-base-100 rounded-t-none p-2">
                <Link to="/login" className="mr-4 text-blue-500 hover:underline">Connexion</Link>
                <Link to="/register" className="text-blue-500 hover:underline">Inscription</Link>
              </ul>
            </details>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
