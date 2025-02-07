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
        <div className="flex items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;
