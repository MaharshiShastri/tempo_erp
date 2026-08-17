export default function QuotationStatusBadge({ quotation }) {

    const status = quotation?.status || "GENERATED";

    const config = {
        GENERATED: {label: "Awaiting Response", background: "var(--bg-main)", color: "var(--text-muted)",},

        ORDERED: {label: "Order Received", background: "rgba(16,185,129,.10)", color: "var(--brand-success)",},

        REJECTED: {label: "Rejected", background: "rgba(239,68,68,.10)", color: "var(--brand-danger)",},

        CHANGED: {label: "Changed", background: "rgba(245,158,11,.10)", color: "#d97706",},
    };

    const meta = config[status] || config.GENERATED;

    return (
        <span style={{display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: meta.background, color: meta.color, whiteSpace: "nowrap",}}>
            <span style={{width: 6, height: 6, borderRadius: "50%", background: meta.color,}}/>
            {meta.label}
        </span>
    );
}