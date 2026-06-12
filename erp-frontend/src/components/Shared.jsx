import React from "react";

export const ToastContainer = ({toasts}) => {
    if(!toasts || toasts.length === 0)return null;

    return(
        <div className="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast-message toast-${toast.type}`}>
                    {toast.message}
                </div>
            ))}
        </div>
    );
};