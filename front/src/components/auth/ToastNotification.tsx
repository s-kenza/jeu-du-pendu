import { useEffect } from "react";

interface ToastNotificationProps {
  message: string;
  type?: "success" | "error";
  setMessage: (message: string) => void;
}

const ToastNotification = ({ message, type = "success", setMessage }: ToastNotificationProps) => {
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(''), 5000); // Cache le toast après 5s
      return () => clearTimeout(timeout);
    }
  }, [message, setMessage]);

  if (!message) return null;

  return (
    <div className="toast toast-top toast-center z-50">
      <div className={`alert shadow-lg ${type === "success" ? "alert-success" : "alert-error"}`}>
        <div className="flex items-center gap-4">
        {type === "success" ? (
            // Icône succès
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ) : (
            // Icône erreur
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m0 3.75h.007v.008H12v-.008ZM3.375 18.75l8.625-15 8.625 15H3.375Z" />
            </svg>
          )}
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;
