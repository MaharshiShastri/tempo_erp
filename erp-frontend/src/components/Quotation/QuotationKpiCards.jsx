import { useMemo } from "react";

export default function QuotationKpiCards({quotations = [],}) {

    const metrics = useMemo(() => {

        const total = quotations.length;

        const generated = quotations.filter(q => (q.status || "GENERATED") === "GENERATED").length;

        const ordered = quotations.filter(q => q.status === "ORDERED").length;

        const changed = quotations.filter(q => q.status === "CHANGED").length;

        const rejected = quotations.filter(q => q.status === "REJECTED").length;

        const conversion = total > 0 ? ((ordered / total) * 100).toFixed(1) : "0.0";

        return {total, generated, ordered, changed, rejected,conversion,};

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
            color: "var(--brand-success)",
        },

        {
            label: "Changed",
            value: metrics.changed,
            color: "#d97706",
        },

        {
            label: "Conversion Rate",
            value: `${metrics.conversion}%`,
            color: "var(--brand-accent)",
            footer: `${metrics.rejected} rejected`,
        },
    ];

    return (
        <div style={{display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12, marginBottom: 20,}}>
            {cards.map(card => (
                <div key={card.label} className="frappe-card" style={{padding: 16,}}>
                    <small style={{ color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, fontSize: 10,}}>
                        {card.label}
                    </small>

                    <div style={{marginTop: 6, fontSize: 24, fontWeight: 750, color: card.color || "var(--text-primary)",}}>
                        {card.value}
                    </div>

                    {card.footer && (
                        <small style={{color: "var(--text-muted)",}}>
                            {card.footer}
                        </small>
                    )}
                </div>
            ))}
        </div>
    );
}