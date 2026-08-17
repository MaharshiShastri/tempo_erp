export default function QuotationDeleteModal({quotation, onCancel, onConfirm,}) {

    if (!quotation) {return null;}

    return (
        <div className="modal-overlay">

            <div className="frappe-card" style={{width: "min(450px, 90vw)",}}>

                <h3>
                    Deactivate Quotation?
                </h3>

                <p style={{ color: "var(--text-muted)",}}>
                    Quotation{" "}
                    <strong>
                        {quotation.quote_number}
                    </strong>{" "}
                    will be removed from the active
                    register.
                </p>

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "flex-end",
                        gap: 10,
                        marginTop: 20,
                    }}
                >

                    <button
                        className="btn-text"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <button
                        className="btn-text-danger"
                        onClick={onConfirm}
                    >
                        Delete
                    </button>

                </div>

            </div>

        </div>
    );
}