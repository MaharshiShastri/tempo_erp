export default function QuotationDetailsModal({
    quotation,
    editMode,
    editForm,
    saving,
    onChange,
    onSave,
    onClose,
    onEdit,
}) {
    if (!quotation) {
        return null;
    }

    const field = (
        label,
        key,
        {
            type = "text",
            multiline = false,
            rows = 3,
        } = {}
    ) => {
        const value = editMode
            ? (editForm?.[key] ?? "")
            : (quotation?.[key] ?? "");

        if (multiline) {
            return (
                <div className="form-group">
                    <label>{label}</label>

                    {editMode ? (
                        <textarea
                            className="form-input"
                            rows={rows}
                            value={value}
                            onChange={(e) =>
                                onChange(
                                    key,
                                    e.target.value
                                )
                            }
                        />
                    ) : (
                        <div
                            className="form-input"
                            style={{
                                minHeight: 70,
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {value || "—"}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="form-group">
                <label>{label}</label>

                {editMode ? (
                    <input
                        type={type}
                        className="form-input"
                        value={value}
                        onChange={(e) =>
                            onChange(
                                key,
                                e.target.value
                            )
                        }
                    />
                ) : (
                    <div className="form-input">
                        {value || "—"}
                    </div>
                )}
            </div>
        );
    };

    const checkbox = (
        label,
        key
    ) => (
        <label
            style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                cursor: editMode
                    ? "pointer"
                    : "default",
            }}
        >
            <input
                type="checkbox"
                checked={
                    Boolean(
                        editMode
                            ? editForm?.[key]
                            : quotation?.[key]
                    )
                }
                disabled={!editMode}
                onChange={(e) =>
                    onChange(
                        key,
                        e.target.checked
                    )
                }
            />

            {label}
        </label>
    );

    const formatDate = (value) => {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        );
    };

    return (
        <div className="modal-overlay">

            <div
                className="frappe-card"
                style={{
                    width: "min(900px, 95vw)",
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: "center",
                        marginBottom: 20,
                        paddingBottom: 15,
                        borderBottom:
                            "1px solid var(--border-light)",
                    }}
                >

                    <div>
                        <h3
                            style={{
                                margin: 0,
                            }}
                        >
                            {editMode
                                ? "Edit Quotation"
                                : "Quotation Details"}
                        </h3>

                        <div
                            style={{
                                marginTop: 6,
                                fontFamily:
                                    "monospace",
                                color:
                                    "var(--brand-accent)",
                                fontWeight: 700,
                            }}
                        >
                            {quotation.quote_number ||
                                "—"}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn-text"
                        onClick={onClose}
                    >
                        ✕ Close
                    </button>

                </div>


                {/* =====================================================
                    LIFECYCLE SUMMARY
                ====================================================== */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(4, minmax(0, 1fr))",
                        gap: 10,
                        marginBottom: 25,
                    }}
                >

                    <div
                        style={{
                            padding: 12,
                            borderRadius: 8,
                            background:
                                "var(--bg-main)",
                        }}
                    >
                        <small
                            style={{
                                color:
                                    "var(--text-muted)",
                            }}
                        >
                            Status
                        </small>

                        <div
                            style={{
                                marginTop: 4,
                                fontWeight: 700,
                            }}
                        >
                            {quotation.status ||
                                "GENERATED"}
                        </div>
                    </div>


                    <div
                        style={{
                            padding: 12,
                            borderRadius: 8,
                            background:
                                "var(--bg-main)",
                        }}
                    >
                        <small
                            style={{
                                color:
                                    "var(--text-muted)",
                            }}
                        >
                            Generated
                        </small>

                        <div
                            style={{
                                marginTop: 4,
                                fontWeight: 700,
                            }}
                        >
                            {formatDate(
                                quotation.generated_at
                            )}
                        </div>
                    </div>


                    <div
                        style={{
                            padding: 12,
                            borderRadius: 8,
                            background:
                                "var(--bg-main)",
                        }}
                    >
                        <small
                            style={{
                                color:
                                    "var(--text-muted)",
                            }}
                        >
                            Resolved
                        </small>

                        <div
                            style={{
                                marginTop: 4,
                                fontWeight: 700,
                            }}
                        >
                            {formatDate(
                                quotation.resolved_at
                            )}
                        </div>
                    </div>


                    <div
                        style={{
                            padding: 12,
                            borderRadius: 8,
                            background:
                                "var(--bg-main)",
                        }}
                    >
                        <small
                            style={{
                                color:
                                    "var(--text-muted)",
                            }}
                        >
                            ERP Order
                        </small>

                        <div
                            style={{
                                marginTop: 4,
                                fontWeight: 700,
                                color:
                                    quotation.converted_order_id
                                        ? "var(--brand-success)"
                                        : "var(--text-muted)",
                            }}
                        >
                            {quotation.converted_order_id
                                ? `#${quotation.converted_order_id}`
                                : "Not converted"}
                        </div>
                    </div>

                </div>


                {/* =====================================================
                    CUSTOMER DETAILS
                ====================================================== */}

                <h4
                    style={{
                        marginBottom: 15,
                    }}
                >
                    Customer Details
                </h4>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(2, minmax(0, 1fr))",
                        gap: 16,
                    }}
                >

                    {field(
                        "Customer Company",
                        "client_company"
                    )}

                    {field(
                        "Product",
                        "product_name"
                    )}

                    {field(
                        "Buyer Name",
                        "buyer_name"
                    )}

                    {field(
                        "Buyer Phone",
                        "buyer_phone_number"
                    )}

                    {field(
                        "Client Email",
                        "client_email",
                        {
                            type: "email",
                        }
                    )}

                    {field(
                        "Enquiry Date",
                        "enquiry_date",
                        {
                            type: "date",
                        }
                    )}

                    {field(
                        "City",
                        "client_city"
                    )}

                    {field(
                        "Postal Code",
                        "client_postal_code"
                    )}

                </div>


                {/* ADDRESS */}

                <div style={{ marginTop: 16 }}>
                    {field(
                        "Address",
                        "client_address_line1",
                        {
                            multiline: true,
                            rows: 3,
                        }
                    )}
                </div>


                <hr
                    style={{
                        margin: "25px 0",
                        border: 0,
                        borderTop:
                            "1px solid var(--border-light)",
                    }}
                />


                {/* =====================================================
                    COMMERCIAL TERMS
                ====================================================== */}

                <h4
                    style={{
                        marginBottom: 15,
                    }}
                >
                    Commercial Terms
                </h4>

                {field(
                    "Supply",
                    "supply",
                    {
                        multiline: true,
                        rows: 4,
                    }
                )}

                {field(
                    "Installation",
                    "installation",
                    {
                        multiline: true,
                        rows: 3,
                    }
                )}

                {field(
                    "Freight",
                    "freight",
                    {
                        multiline: true,
                        rows: 3,
                    }
                )}


                {/* =====================================================
                    QUOTATION FLAGS
                ====================================================== */}

                <div
                    style={{
                        display: "flex",
                        gap: 25,
                        marginTop: 15,
                        padding: 14,
                        background:
                            "var(--bg-main)",
                        borderRadius: 8,
                    }}
                >
                    {checkbox(
                        "Dealer quotation",
                        "is_dealer"
                    )}

                    {checkbox(
                        "Special model",
                        "is_special_model"
                    )}
                </div>


                {/* =====================================================
                    SALES OWNER
                ====================================================== */}

                <div
                    style={{
                        marginTop: 20,
                        padding: 14,
                        border:
                            "1px solid var(--border-light)",
                        borderRadius: 8,
                    }}
                >
                    <small
                        style={{
                            color:
                                "var(--text-muted)",
                        }}
                    >
                        Sales Owner
                    </small>

                    <div
                        style={{
                            marginTop: 4,
                            fontWeight: 650,
                        }}
                    >
                        {quotation.sales_user_name ||
                            "—"}
                    </div>

                    <div
                        style={{
                            marginTop: 2,
                            fontSize: 12,
                            color:
                                "var(--text-muted)",
                        }}
                    >
                        {quotation.sales_user_email ||
                            "—"}
                    </div>
                </div>


                {/* =====================================================
                    TIMELINE
                ====================================================== */}

                <div
                    style={{
                        marginTop: 20,
                        padding: 14,
                        border:
                            "1px solid var(--border-light)",
                        borderRadius: 8,
                    }}
                >

                    <h5
                        style={{
                            marginTop: 0,
                            marginBottom: 12,
                        }}
                    >
                        Lifecycle Timeline
                    </h5>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(3, 1fr)",
                            gap: 12,
                            fontSize: 12,
                        }}
                    >

                        <div>
                            <div
                                style={{
                                    color:
                                        "var(--text-muted)",
                                }}
                            >
                                Completed
                            </div>

                            <strong>
                                {formatDate(
                                    quotation.completed_at
                                )}
                            </strong>
                        </div>

                        <div>
                            <div
                                style={{
                                    color:
                                        "var(--text-muted)",
                                }}
                            >
                                Rejected
                            </div>

                            <strong>
                                {formatDate(
                                    quotation.rejected_at
                                )}
                            </strong>
                        </div>

                        <div>
                            <div
                                style={{
                                    color:
                                        "var(--text-muted)",
                                }}
                            >
                                Changed
                            </div>

                            <strong>
                                {formatDate(
                                    quotation.changed_at
                                )}
                            </strong>
                        </div>

                    </div>

                </div>


                {/* =====================================================
                    FOOTER
                ====================================================== */}

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "flex-end",
                        gap: 10,
                        marginTop: 25,
                        paddingTop: 15,
                        borderTop:
                            "1px solid var(--border-light)",
                    }}
                >

                    {editMode ? (
                        <>
                            <button
                                type="button"
                                className="btn-text"
                                onClick={onClose}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={onSave}
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="btn-text"
                                onClick={onClose}
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={onEdit}
                            >
                                Edit Quotation
                            </button>
                        </>
                    )}

                </div>

            </div>

        </div>
    );
}