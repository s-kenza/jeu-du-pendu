import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* En-tête */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between">
          <h1 className="text-xl font-bold">Mon Application</h1>
          <nav>
            <Link to="/login" className="mr-4 text-blue-500 hover:underline">Connexion</Link>
            <Link to="/register" className="text-blue-500 hover:underline">Inscription</Link>
          </nav>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 text-center text-gray-600">
          © 2024 Mon Application. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
