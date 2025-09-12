import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import AuthLayout from './components/auth/Home';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import VerifyEmail from './components/auth/VerifyEmail';
import Game from './components/game/Game';
import { AuthProvider } from './components/context/AuthContext';
import InBuilding from './components/InBuilding';
import PrivacyPolicy from './components/PrivacyPolicy';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    errorElement: <div>404 Not Found</div>,
    children: [
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'game',
        element: <Game />,
      },
      {
        path: '/verify/:token',
        element: <VerifyEmail />
      },
      {
        path: '/building',
        element: <InBuilding />
      },
      {
        path: '/privacy-policy',
        element: <PrivacyPolicy />
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
