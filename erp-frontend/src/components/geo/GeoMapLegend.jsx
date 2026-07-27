export default function GeoMapLegend() {

    const levels = [
        { color: "#08306b", label: "> ₹5,00,000" },
        { color: "#2171b5", label: "₹2,50,000 - ₹5,00,000" },
        { color: "#6baed6", label: "₹1,00,000 - ₹2,50,000" },
        { color: "#c6dbef", label: "₹1 - ₹1,00,000" },
        { color: "#f2f2f2", label: "No sales" }
    ];

    return (
        <div
            style={{position: "absolute", right: 20, bottom: 20, background: "var(--bg-surface)", padding: 12, borderRadius: 8, border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,.15)"}}>
 
            <b>Revenue</b>

            {levels.map(level => (

                <div key={level.label} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8}}>

                    <div style={{ width: 18, height: 18, background: level.color, border: "1px solid #aaa"}}/>

                    {level.label}

                </div>

            ))}
        </div>
    );
}