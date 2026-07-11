import React, { useState } from "react";
import API from "../api/api";
import { FiUploadCloud, FiCheckCircle, FiTrash2, FiDatabase } from "react-icons/fi";

export default function TallyImportWorkspaceView({ state }) {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // The "Buffered DB" holding the AI-mapped JSON before it goes to production
    const [stagedOrders, setStagedOrders] = useState([]); 
    const [isCommitting, setIsCommitting] = useState(false);

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        state.setAlertMessage("🧠 Parsing XML and Mapping schema via Groq AI...");
        state.setIsAlertOpen(true);

        try {
            const response = await API.uploadTallyJSON(file, state.user.access_token);
            setStagedOrders(response.extracted_orders || []);
            
            state.setAlertMessage(`✅ Successfully translated ${response.extracted_orders?.length || 0} orders.`);
            state.setIsAlertOpen(true);
        } catch (err) {
            state.showErrorModal("Import Failed", err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const removeStagedOrder = (index) => {
        setStagedOrders(prev => prev.filter((_, i) => i !== index));
    };

    const commitToProductionDB = async () => {
        if (!window.confirm(`Are you sure you want to write these ${stagedOrders.length} orders into the Production ERP?`)) return;
        
        setIsCommitting(true);
        let successCount = 0;
        let failCount = 0;

        // Loop through the buffer and hit your existing orders API
        for (const order of stagedOrders) {
            try {
                // Hitting the existing endpoint from orders_router.py
                await API.saveOrder(order, state.user.access_token);
                successCount++;
            } catch (err) {
                console.error(`Failed to insert order ${order.purchase_order_number}:`, err);
                failCount++;
            }
        }

        setIsCommitting(false);
        setStagedOrders([]); // Clear the buffer
        setFile(null);
        
        state.showErrorModal(
            "Migration Complete", 
            `Successfully wrote ${successCount} orders to production. Failed: ${failCount}`
        );
        
        // Refresh the global orders state
        if (state.refreshDataHub) state.refreshDataHub();
    };

    return (
        <div className="frappe-card" style={{ maxWidth: 1200, margin: "0 auto", padding: 25 }}>
            <div className="system-header" style={{ marginBottom: "20px" }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <FiDatabase /> Tally XML Migration Engine
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Upload DayBook JSON. AI will translate the data into the ERP schema for your review.
                </p>
            </div>

            {/* Step 1: Upload Zone */}
            <form onSubmit={handleFileUpload} style={{ background: "var(--bg-main)", padding: "20px", borderRadius: "8px", border: "1px dashed var(--brand-accent)", marginBottom: "30px", display: "flex", gap: "15px", alignItems: "center" }}>
                <input 
                    type="file" 
                    accept=".json" 
                    className="form-input" 
                    onChange={e => setFile(e.target.files[0])} 
                    style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" disabled={isUploading || !file} style={{ whiteSpace: "nowrap", display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiUploadCloud /> {isUploading ? "AI is Parsing..." : "Extract & Buffer"}
                </button>
            </form>

            {/* Step 2: The Buffered DB View */}
            {stagedOrders.length > 0 && (
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ padding: "15px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fffcf5" }}>
                        <h4 style={{ margin: 0, color: "#b25900" }}>Staged Orders (Awaiting ERP Commit)</h4>
                        <button className="btn btn-success" onClick={commitToProductionDB} disabled={isCommitting} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiCheckCircle /> {isCommitting ? "Writing to DB..." : "Commit All to Production ERP"}
                        </button>
                    </div>
                    
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', background: "var(--bg-main)", borderBottom: '2px solid var(--border-light)' }}>
                                    <th style={{ padding: '10px' }}>Tally Voucher Ref</th>
                                    <th style={{ padding: '10px' }}>Date</th>
                                    <th style={{ padding: '10px' }}>Billing Name</th>
                                    <th style={{ padding: '10px' }}>Total Items</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Discard</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stagedOrders.map((order, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--brand-accent)' }}>
                                            {order.purchase_order_number}
                                        </td>
                                        <td style={{ padding: '10px' }}>{order.order_acceptance_date}</td>
                                        <td style={{ padding: '10px' }}>{order.billing_name}</td>
                                        <td style={{ padding: '10px' }}>
                                            <span style={{ background: 'var(--bg-main)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                                {order.items?.length || 0} items mapped
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <button className="btn-text-danger" onClick={() => removeStagedOrder(idx)}>
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}