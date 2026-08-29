import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function QuotationKpiCards({ quotations = [] }) {
    const metrics = useMemo(() => {
        const total = quotations.length;

        const generated = quotations.filter(
            (q) => (q.status || "GENERATED") === "GENERATED"
        ).length;

        const ordered = quotations.filter(
            (q) => q.status === "ORDERED"
        ).length;

        const changed = quotations.filter(
            (q) => q.status === "CHANGED"
        ).length;

        const rejected = quotations.filter(
            (q) => q.status === "REJECTED"
        ).length;

        const conversion =
            total > 0
                ? ((ordered / total) * 100).toFixed(1)
                : "0.0";

        return {
            total,
            generated,
            ordered,
            changed,
            rejected,
            conversion,
        };
    }, [quotations]);

    const cards = [
        {
            label: "All Quotations",
            value: metrics.total,
        },
        {
            label: "Awaiting Response",
            value: metrics.generated,
        },
        {
            label: "Orders Received",
            value: metrics.ordered,
            className: "text-emerald-600",
        },
        {
            label: "Changed",
            value: metrics.changed,
            className: "text-amber-600",
        },
        {
            label: "Conversion Rate",
            value: `${metrics.conversion}%`,
            className: "text-primary",
            footer: `${metrics.rejected} rejected`,
        },
    ];

    return (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map((card) => (
                <Card key={card.label}>
                    <CardContent className="p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {card.label}
                        </div>

                        <div
                            className={`mt-1.5 text-2xl font-bold ${
                                card.className || ""
                            }`}
                        >
                            {card.value}
                        </div>

                        {card.footer && (
                            <div className="mt-1 text-xs text-muted-foreground">
                                {card.footer}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}