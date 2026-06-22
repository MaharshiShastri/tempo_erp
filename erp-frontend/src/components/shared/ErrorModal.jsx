import React from "react";

function ErrorModal({ isOpen, title = "Error", message = "", onClose }) {
    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <button style={styles.closeBtn} onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div style={styles.body}>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                        {message || "Something went wrong."}
                    </p>
                </div>

                <div style={styles.footer}>
                    <button style={styles.primaryBtn} onClick={onClose}>
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
    },
    modal: {
        width: "420px",
        maxWidth: "90%",
        background: "#fff",
        borderRadius: "10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        overflow: "hidden",
        animation: "fadeIn 0.15s ease-in-out",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid #eee",
        fontWeight: 600,
    },
    body: {
        padding: "16px",
        fontSize: "14px",
        color: "#333",
    },
    footer: {
        padding: "12px 16px",
        display: "flex",
        justifyContent: "flex-end",
        borderTop: "1px solid #eee",
    },
    closeBtn: {
        border: "none",
        background: "transparent",
        fontSize: "16px",
        cursor: "pointer",
    },
    primaryBtn: {
        padding: "6px 12px",
        borderRadius: "6px",
        border: "none",
        background: "#2563eb",
        color: "white",
        cursor: "pointer",
    },
};

export default ErrorModal;