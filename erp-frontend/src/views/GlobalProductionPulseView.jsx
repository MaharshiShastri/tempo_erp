import React, { useState, useEffect } from "react";
import API from "../api/api";
import { FiActivity, FiArrowRight } from "react-icons/fi";

const STAGES = [
    { key: "PO_SUBMITTED", label: "PO Submitted", color: "var(--text-muted)", bg: "var(--bg-main)" },
    { key: "RAW_MATERIAL_ASSEMBLY", label: "Material Assembly", color: "var(--brand-accent)", bg: "#f0f7ff" },
    { key: "PRODUCTION_IN_PROGRESS", label: "In Production", color: "#e67e22", bg: "#fff8f0" },
    { key: "READY_TO_DISPATCH", label: "Ready for Dispatch", color: "var(--brand-success)", bg: "#eaffea" },
    { key: "DISPATCHED", label: "Dispatched & Invoiced", color: "#8e44ad", bg: "#f5eef8" }
];

export default function GlobalProductionPulseView({ state }) {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const isFactory = ["Shop Floor Administrator", "Admin", "Chief Full Stack Developer"].includes(state.user.role);

    useEffect(() => { loadPulse(); }, []);

    const loadPulse = async () => {
        try {
            const data = await API.fetchProductionPulse(state.user.access_token);
            setOrders(data);
        } catch (err) { state.showErrorModal("Error", err.message); }
        finally { setIsLoading(false); }
    };

    const handleMoveStage = async (orderId, currentStage) => {
        if (!isFactory) return;
        
        const currentIndex = STAGES.findIndex(s => s.key === currentStage);
        if (currentIndex === -1 || currentIndex === STAGES.length - 1) return;

        const nextStage = STAGES[currentIndex + 1].key;
        
        // Optimistic UI Update for snappy feel
        setOrders(prev => prev.map(o => o.order_acceptance_id === orderId ? { ...o, production_stage: nextStage } : o));

        try {
            await API.updateOrderStage(orderId, nextStage, state.user.access_token);
            state.addToast(`Order ${orderId} moved to ${STAGES[currentIndex + 1].label}`, "success");
        } catch (err) {
            // Revert on failure
            await loadPulse();
            state.showErrorModal("Update Failed", err.message);
        }
    };

    if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Factory Floor...</div>;

    return (
        <div style={{ maxWidth: 1400, margin: "0 auto", height: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="frappe-card" style={{ padding: 25, marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiActivity /> Global Production Pulse
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Company-wide transparency: Track real-time movement of active orders across the shop floor.
                </p>
            </div>

            {/* Kanban Board Layout */}
            <div style={{ display: "flex", gap: "15px", flexGrow: 1, overflowX: "auto", paddingBottom: "10px" }}>
                {STAGES.map(stage => {
                    const stageOrders = orders.filter(o => o.production_stage === stage.key || (!o.production_stage && stage.key === 'PO_SUBMITTED'));
                    
                    return (
                        <div key={stage.key} style={{ minWidth: "280px", flex: 1, background: "var(--bg-surface)", border: "1px solid var(--border-light)", borderRadius: "8px", display: "flex", flexDirection: "column" }}>
                            
                            {/* Column Header */}
                            <div style={{ padding: "12px 15px", borderBottom: `2px solid ${stage.color}`, background: stage.bg, borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: "13px", color: stage.color }}>{stage.label}</strong>
                                <span style={{ fontSize: "11px", background: "rgba(0,0,0,0.1)", padding: "2px 8px", borderRadius: "12px", color: stage.color }}>
                                    {stageOrders.length}
                                </span>
                            </div>

                            {/* Column Body */}
                            <div style={{ padding: "10px", flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                                {stageOrders.map(order => (
                                    <div key={order.order_acceptance_id} style={{ background: "var(--bg-main)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                        <div style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-muted)", marginBottom: "4px" }}>
                                            {order.order_acceptance_id}
                                        </div>
                                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "8px" }}>
                                            {order.billing_name}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "var(--brand-danger)", marginBottom: "12px" }}>
                                            Due: {order.due_date}
                                        </div>

                                        {/* Action Button (Only for Factory/Admin) */}
                                        {isFactory && stage.key !== "DISPATCHED" && (
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ width: "100%", fontSize: "11px", padding: "6px", display: "flex", justifyContent: "center", alignItems: "center", gap: "4px" }}
                                                onClick={() => handleMoveStage(order.order_acceptance_id, stage.key)}
                                            >
                                                Advance Stage <FiArrowRight />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {stageOrders.length === 0 && (
                                    <div style={{ textAlign: "center", color: "var(--border-light)", fontSize: "12px", padding: "20px 0" }}>Empty</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}