import { Button } from "@/components/ui/button";

export default function QuotationActions({
    quotation,
    onView,
    onEdit,
    onOrder,
    onReject,
    onChanged,
    onOrderBooking,
}) {
    const status = quotation.status || "GENERATED"
    const isGenerated = (quotation?.status || "GENERATED") === "GENERATED";
    const isOrdered = status == "ORDERED";
    return (
        <div className="flex items-center justify-end gap-1">
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onView?.(quotation)}
            >
                View
            </Button>

            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(quotation)}
            >
                Edit
            </Button>

            {isGenerated && (
                <>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOrder?.(quotation)}
                    >
                        ✓ Order
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onChanged?.(quotation)}
                    >
                        ↔ Changed
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onReject?.(quotation)}
                    >
                        Reject
                    </Button>
                </>
            )}

            {isOrdered && (
                <Button type="button" variant="outline" size="sm" onClick={() => { console.log("Qoute number inside view: ", quotation.quote_number); onOrderBooking?.(quotation);}}>
                    🖨 Order Booking
                </Button>
            )}
        </div>
    );
}