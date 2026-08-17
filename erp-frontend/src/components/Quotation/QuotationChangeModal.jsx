export default function QuotationChangeModal({quotation, form, onChange, onCancel,onSubmit,}) {

    if (!quotation) {
        return null;
    }

    const field = (name, label, type = "text") => (
        <div className="form-group">

            <label>
                {label}
            </label>

            <input type={type} 
                className="form-input"
                value={form[name] ?? ""}
                onChange={e =>
                    onChange(
                        name,
                        e.target.value
                    )
                }
            />

        </div>
    );

    return (
        <div className="modal-overlay">

            <div
                className="frappe-card"
                style={{
                    width:
                        "min(800px, 95vw)",
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >

                <div
                    className="system-header"
                >
                    <div>
                        <h3>
                            Quotation Changed
                        </h3>

                        <small
                            style={{
                                color:
                                    "var(--text-muted)",
                            }}
                        >
                            {
                                quotation.quote_number
                            }
                        </small>
                    </div>

                    <button
                        className="btn-text"
                        onClick={onCancel}
                    >
                        ✕ Close
                    </button>
                </div>


                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "1fr 1fr",
                        gap: 20,
                    }}
                >

                    {/* QUOTED */}
                    <div
                        style={{
                            border:
                                "1px solid var(--border-light)",
                            borderRadius: 10,
                            padding: 16,
                        }}
                    >

                        <h4>
                            Quoted
                        </h4>

                        {field(
                            "quoted_product_name",
                            "Product"
                        )}

                        {field(
                            "quoted_item_code",
                            "Item Code"
                        )}

                        {field(
                            "quoted_quantity",
                            "Quantity",
                            "number"
                        )}

                        {field(
                            "quoted_rate",
                            "Rate",
                            "number"
                        )}

                    </div>


                    {/* ORDERED */}
                    <div
                        style={{
                            border:
                                "1px solid rgba(16,185,129,.25)",
                            borderRadius: 10,
                            padding: 16,
                            background:
                                "rgba(16,185,129,.03)",
                        }}
                    >

                        <h4>
                            Actually Ordered
                        </h4>

                        {field(
                            "ordered_product_name",
                            "Product *"
                        )}

                        {field(
                            "ordered_item_code",
                            "Item Code"
                        )}

                        {field(
                            "ordered_quantity",
                            "Quantity",
                            "number"
                        )}

                        {field(
                            "ordered_rate",
                            "Rate",
                            "number"
                        )}

                    </div>

                </div>


                {field(
                    "order_id",
                    "ERP Order ID",
                    "number"
                )}


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
                        className="btn btn-primary"
                        onClick={onSubmit}
                    >
                        Save Snapshot
                    </button>

                </div>

            </div>

        </div>
    );
}