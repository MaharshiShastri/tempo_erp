export default function SharedAlertModal({ isOpen, message, onClose }) {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <h3>⚠️ Master Data System Alert</h3>
                <p>{message}</p>
                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={onClose}>Acknowledge Notice</button>
                </div>
            </div>
        </div>
    );
};
