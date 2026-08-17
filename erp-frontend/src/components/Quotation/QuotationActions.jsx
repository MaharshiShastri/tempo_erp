export default function QuotationActions({quotation, onView, onEdit, onOrder, onReject, onChanged,}) {

    const isGenerated = (quotation.status || "GENERATED") === "GENERATED";

    return (
        <div style={{display: "inline-flex", gap: 4, justifyContent: "flex-end",}}>
            <button className="btn-text" onClick={() =>onView?.(quotation)}>
                View
            </button>

            <button className="btn-text" onClick={() => onEdit?.(quotation)}>
                Edit
            </button>

            {isGenerated && (
                <>
                    <button className="btn-text" onClick={() => onOrder?.(quotation)}>
                        ✓ Order
                    </button>

                    <button className="btn-text" onClick={() =>onChanged?.(quotation)}>
                        ↔ Changed
                    </button>

                    <button className="btn-text-danger" onClick={() => onReject?.(quotation)}>
                        Reject
                    </button>
                </>
            )}
        </div>
    );
}