import { FiActivity, FiArrowRight } from "react-icons/fi";

export default function GlobalProductionPulseView({ state }) {
    const {STAGES, orders, isLoading, isFactory, loadPulse, handleMoveStage, isDispatcher} = state;

    if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Factory Floor...</div>;

    return (
        <div style={{ maxWidth: 1400, margin: "0 auto", height: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="frappe-card" style={{ padding: 25, marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiActivity /> Global Production Pulse
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Company-wide transparency: Track real-time movement of active products across the shop floor.
                </p>
            </div>

            {/* Kanban Board Layout */}
            <div style={{ display: "flex", gap: "15px", flexGrow: 1, overflowX: "auto", paddingBottom: "10px" }}>
                {STAGES.map(stage => {
                    // 1. Filter orders for this stage
                    const stageOrders = orders.filter(o => o.production_stage === stage.key || (!o.production_stage && stage.key === 'PO_SUBMITTED'));
                    
                    // 2. Flatten orders into individual item cards
                    const stageItems = stageOrders.flatMap(order => {
                        // Fallback if the backend hasn't joined the items array yet
                        const items = order.items && order.items.length > 0 ? order.items : [{ item_code: "Item details unavailable" }];
                        
                        return items.map((item, index) => ({
                            ...item,
                            _parentOrder: order, 
                            _uniqueKey: `${order.order_id}-${index}`
                        }));
                    });
                    
                    return (
                        <div key={stage.key} style={{ minWidth: "280px", flex: 1, background: "var(--bg-surface)", border: "1px solid var(--border-light)", borderRadius: "8px", display: "flex", flexDirection: "column" }}>
                            
                            {/* Column Header */}
                            <div style={{ padding: "12px 15px", borderBottom: `2px solid ${stage.color}`, background: stage.bg, borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: "13px", color: stage.color }}>{stage.label}</strong>
                                <span style={{ fontSize: "11px", background: "rgba(0,0,0,0.1)", padding: "2px 8px", borderRadius: "12px", color: stage.color }}>
                                    {stageItems.length} {/* Now shows total product count, not order count */}
                                </span>
                            </div>

                            {/* Column Body */}
                            <div style={{ padding: "10px", flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                                {stageItems.map(item => (
                                    <div key={item._uniqueKey} style={{ background: "var(--bg-main)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                        
                                        {/* Product Details (Primary Focus) */}
                                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "4px" }}>
                                            {item.item_code} {item.quantity ? <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>(x{item.quantity})</span> : ""}
                                        </div>
                                        
                                        {/* OA ID (Secondary Focus) */}
                                        <div style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-muted)", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                                            <span>OA: {item._parentOrder.order_id}</span>
                                            <span style={{ color: "var(--brand-danger)" }}>Due: {item._parentOrder.due_date}</span>
                                        </div>

                                        {/* Action Button */}
                                        {isFactory && stage.key !== "DISPATCHED" && stage.key !== "READY_TO_DISPATCH" && (
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ width: "100%", fontSize: "11px", padding: "6px", display: "flex", justifyContent: "center", alignItems: "center", gap: "4px" }}
                                                onClick={() => handleMoveStage(item._parentOrder.order_id, stage.key)}
                                            >
                                                Advance Stage <FiArrowRight />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {stageItems.length === 0 && (
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