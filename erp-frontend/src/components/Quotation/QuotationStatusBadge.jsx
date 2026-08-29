import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
    GENERATED: {
        label: "Awaiting Response",
        variant: "secondary",
    },
    ORDERED: {
        label: "Order Received",
        variant: "success",
    },
    REJECTED: {
        label: "Rejected",
        variant: "destructive",
    },
    CHANGED: {
        label: "Changed",
        variant: "warning",
    },
};

export default function QuotationStatusBadge({ quotation }) {
    const status = quotation?.status || "GENERATED";

    const meta =
        STATUS_CONFIG[status] || STATUS_CONFIG.GENERATED;

    return (
        <Badge
            variant={meta.variant}
            className="whitespace-nowrap"
        >
            <span className="mr-1.5 size-1.5 rounded-full bg-current" />
            {meta.label}
        </Badge>
    );
}