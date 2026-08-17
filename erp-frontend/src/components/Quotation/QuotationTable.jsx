import QuotationStatusBadge from "./QuotationStatusBadge";
import QuotationActions from "./QuotationActions";

export default function QuotationTable({quotations = [], onView, onEdit, onOrder, onReject, onChanged, onDownload,}) {

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

    if (!quotations.length) {

        return (
            <div style={{padding: 50, textAlign: "center", color: "var(--text-muted)",}}>
                <div style={{ fontSize: 30, marginBottom: 10,}}>
                    📄
                </div>

                <strong>
                    No quotations found
                </strong>

                <div style={{marginTop: 5, fontSize: 12,}}>
                    Create your first quotation
                    to begin tracking the sales
                    pipeline.
                </div>
            </div>
        );
    }

    return (
        <div style={{ overflowX: "auto", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)",}}>
            <table>

                <thead>
                    <tr>
                        <th>Quote</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>Enquiry</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th style={{textAlign: "right",}}>Actions</th>
                    </tr>
                </thead>

                <tbody>

                    {quotations.map(
                        quotation => {

                            const isDealer = Boolean(quotation.is_dealer);

                            const isSpecial = Boolean(quotation.is_special_model);

                            return (
                                <tr key={quotation.id}>

                                    <td>
                                        {quotation.document_path ? (
                                            <button className="quotation-number-link" onClick={() => onDownload?.( quotation )}>
                                                {quotation.quote_number}
                                            </button>
                                        ) : (
                                            <strong style={{ fontFamily: "monospace",}}>
                                                {quotation.quote_number}
                                            </strong>
                                        )}

                                        <div style={{marginTop: 3, fontSize: 11, color:"var(--text-muted)",}}>
                                            {formatDate(quotation.generated_at)}
                                        </div>
                                    </td>


                                    <td>
                                        <div style={{fontWeight: 650,}}>
                                            {quotation.client_company}
                                        </div>

                                        <small style={{color: "var(--text-muted)",}}>
                                            {quotation.buyer_name}
                                        </small>
                                    </td>


                                    <td>
                                        <div style={{fontWeight: 650,}}>
                                            {quotation.product_name}
                                        </div>
                                    </td>


                                    <td>
                                        {formatDate(quotation.enquiry_date)}
                                    </td>


                                    <td>
                                        <div style={{display: "flex", gap: 5, flexWrap: "wrap",}}>

                                            {isDealer && (
                                                <span style={{padding: "3px 7px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: "rgba(59,130,246,.10)",color:"var(--brand-accent)",}}>
                                                    DEALER
                                                </span>
                                            )}

                                            {isSpecial && (
                                                <span
                                                    style={{
                                                        padding:
                                                            "3px 7px",
                                                        borderRadius:
                                                            999,
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        background:
                                                            "rgba(16,185,129,.10)",
                                                        color:
                                                            "var(--brand-success)",
                                                    }}
                                                >
                                                    SPECIAL
                                                </span>
                                            )}

                                            {!isDealer &&
                                                !isSpecial && (
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            color:
                                                                "var(--text-muted)",
                                                        }}
                                                    >
                                                        Standard
                                                    </span>
                                                )}

                                        </div>
                                    </td>


                                    <td>
                                        <QuotationStatusBadge
                                            quotation={
                                                quotation
                                            }
                                        />

                                        {quotation.converted_order_id && (
                                            <div
                                                style={{
                                                    marginTop: 4,
                                                    fontSize: 10,
                                                    color:
                                                        "var(--text-muted)",
                                                }}
                                            >
                                                Order #
                                                {
                                                    quotation.converted_order_id
                                                }
                                            </div>
                                        )}
                                    </td>


                                    <td
                                        style={{
                                            textAlign:
                                                "right",
                                            whiteSpace:
                                                "nowrap",
                                        }}
                                    >
                                        <QuotationActions
                                            quotation={
                                                quotation
                                            }
                                            onView={
                                                onView
                                            }
                                            onEdit={
                                                onEdit
                                            }
                                            onOrder={
                                                onOrder
                                            }
                                            onReject={
                                                onReject
                                            }
                                            onChanged={
                                                onChanged
                                            }
                                        />
                                    </td>

                                </tr>
                            );
                        }
                    )}

                </tbody>

            </table>
        </div>
    );
}