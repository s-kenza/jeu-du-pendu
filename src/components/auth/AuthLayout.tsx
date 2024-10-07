import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from '../Footer';
import Navbar from '../Navbar';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* En-tête */}
      <Navbar />

      {/* Contenu principal */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
