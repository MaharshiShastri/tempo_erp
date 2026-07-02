import React from "react";

function ErrorModal({ isOpen, title = "Error", message = "", onClose }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>

                <h3>{title}</h3>

                <p>
                    {message || "Something went wrong."}
                </p>

                <div className="modal-actions">
                    <button onClick={onClose}>
                        Dismiss
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ErrorModal;