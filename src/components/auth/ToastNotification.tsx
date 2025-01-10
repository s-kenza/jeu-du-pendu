import { useState, useEffect } from "react";

const ToastNotification = ({ message, setMessage }) => {
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(''), 5000); // Cache le toast après 5s
      return () => clearTimeout(timeout);
    }
  }, [message, setMessage]);

  if (!message) return null;

  return (
    <div className="toast toast-top toast-center z-50">
      <div className="alert alert-success shadow-lg">
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current flex-shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m0 6a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;
