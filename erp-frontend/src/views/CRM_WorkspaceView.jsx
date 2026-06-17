import { useState, useEffect } from "react";
import API from "../api/api";

export default function CRM_WorkspaceView({ state }) {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadLeads = async () => {
        setLoading(true);
        try {
            const data = await API.fetchLeads(state.user.access_token);
            setLeads(data || []);
        } catch (err) {
            if (state.setAlertMessage && state.setIsAlertOpen) {
                state.setAlertMessage("Failed to sync CRM Pipeline: " + err.message);
                state.setIsAlertOpen(true);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeads();
    }, []);

    const handleStatusChange = async (leadId, newStatus) => {
        try {
            await API.updateLeadStatus(leadId, newStatus, state.user.access_token);
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        } catch (err) {
            if (state.setAlertMessage && state.setIsAlertOpen) {
                state.setAlertMessage("Database Update Failed: " + err.message);
                state.setIsAlertOpen(true);
            }
        }
    };

    // Helper to format the WPForms product query list into tags
    const renderProductTags = (queryStr) => {
        if (!queryStr) return <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>No specific product</span>;
        const products = queryStr.split(',').map(p => p.trim());
        return (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {products.map((prod, i) => (
                    <span key={i} style={{ 
                        background: "var(--bg-surface)", border: "1px solid var(--border-light)", 
                        padding: "2px 8px", borderRadius: "4px", fontSize: "11px", color: "var(--brand-accent)" 
                    }}>
                        {prod}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="frappe-card">
            <div className="system-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h3>🎯 B2B Sales Pipeline</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>Direct GoDaddy Website Feed</p>
                </div>
                <button className="btn btn-secondary" onClick={loadLeads} disabled={loading}>
                    {loading ? "Syncing..." : "↻ Refresh Pipeline"}
                </button>
            </div>

            <div style={{ overflowX: "auto", marginTop: "20px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                        <tr style={{ background: "var(--bg-surface)", textAlign: "left", borderBottom: "2px solid var(--border-light)" }}>
                            <th style={{ padding: "12px", width: "100px" }}>Date</th>
                            <th style={{ padding: "12px", width: "25%" }}>Prospect Entity</th>
                            <th style={{ padding: "12px", width: "20%" }}>Contact & Region</th>
                            <th style={{ padding: "12px", width: "25%" }}>Expressed Interest</th>
                            <th style={{ padding: "12px", width: "10%" }}>Status</th>
                            <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length === 0 && !loading ? (
                            <tr><td colSpan="6" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No pending inquiries in your territory.</td></tr>
                        ) : leads.map((lead) => (
                            <tr key={lead.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                
                                {/* 1. Date */}
                                <td style={{ padding: "12px", color: "var(--text-muted)", fontSize: "12px", verticalAlign: "top" }}>
                                    {new Date(lead.created_at).toLocaleDateString()}
                                </td>

                                {/* 2. Prospect Entity (B2B Focus) */}
                                <td style={{ padding: "12px", verticalAlign: "top" }}>
                                    <div style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "15px" }}>{lead.company_name || "Unknown Company"}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                                        <span style={{ fontSize: "13px", color: "#333" }}>{lead.full_name}</span>
                                        {lead.designation && (
                                            <span style={{ fontSize: "10px", background: "#eef2ff", color: "#4f46e5", padding: "2px 6px", borderRadius: "10px", fontWeight: "bold" }}>
                                                {lead.designation}
                                            </span>
                                        )}
                                    </div>
                                    {lead.gdpr_consent && <div style={{ fontSize: "10px", color: "var(--brand-success)", marginTop: "4px" }}>✓ GDPR Consented</div>}
                                </td>

                                {/* 3. Contact & Location */}
                                <td style={{ padding: "12px", verticalAlign: "top" }}>
                                    <div style={{ fontWeight: "500", fontSize: "13px" }}>{lead.city_state}</div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Zone: {lead.assigned_region}</div>
                                    <div style={{ fontSize: "12px", color: "var(--brand-accent)" }}>✉ {lead.contact_email}</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>📞 {lead.phone_number}</div>
                                </td>

                                {/* 4. Interest / Query */}
                                <td style={{ padding: "12px", verticalAlign: "top" }}>
                                    {renderProductTags(lead.product_query)}
                                </td>

                                {/* 5. Status */}
                                <td style={{ padding: "12px", verticalAlign: "top" }}>
                                    <span style={{ 
                                        padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold",
                                        background: lead.status === 'New' ? "var(--brand-danger)" : lead.status === 'Contacted' ? "var(--brand-warning)" : lead.status === 'Lost' ? "#eee" : "var(--brand-success)",
                                        color: lead.status === 'Lost' ? "#666" : "#fff",
                                        display: "inline-block"
                                    }}>
                                        {lead.status}
                                    </span>
                                </td>

                                {/* 6. Actions */}
                                <td style={{ padding: "12px", textAlign: "right", verticalAlign: "top" }}>
                                    {lead.status === 'New' && (
                                        <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 12px", width: "100%", marginBottom: "5px" }} onClick={() => handleStatusChange(lead.id, 'Contacted')}>
                                            Mark Contacted
                                        </button>
                                    )}
                                    {lead.status === 'Contacted' && (
                                        <>
                                            <button className="btn btn-success" style={{ fontSize: "11px", padding: "6px 12px", width: "100%", marginBottom: "5px" }} onClick={() => handleStatusChange(lead.id, 'Converted')}>
                                                Convert to Client
                                            </button>
                                            <button className="btn" style={{ fontSize: "11px", padding: "6px 12px", width: "100%", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-muted)" }} onClick={() => handleStatusChange(lead.id, 'Lost')}>
                                                Close / Lost
                                            </button>
                                        </>
                                    )}
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}