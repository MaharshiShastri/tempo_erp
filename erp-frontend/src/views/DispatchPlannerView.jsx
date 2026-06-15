import { useState, useEffect } from "react";
import API from "../api/api";

export default function DispatchPlannerView({ state }) {
    // Removed source_state
    const [dim, setDim] = useState({
        width: 0, height: 0, depth: 0, weight: 0, invoice_value: 0, destination_city: "", delivery_distance: 0, diesel_price: 98, cft_charge: 0, min_weight: 0, hamali_detail: "", hamali_cost: 0
    });

    const [newPartner, setNewPartner] = useState({
        name: "Walk-In Transporter", destination_rate: 0, fuel_charge_percentage: 0, documentation_charge: 0, delivery_destination_charge: 0, freight_invoice_brokerage_percentage: 0, hamali_detail: "", hamali_cost: 0
    });

    const [showHamali, setShowHamali] = useState(false);
    const [includeNew, setIncludeNew] = useState(false);
    const [resultsData, setResultsData] = useState(null);
    const [selectedTransport, setSelectedTransport] = useState(null);
    
    // Custom Alert Modal State
    const [modalAlert, setModalAlert] = useState({ isOpen: false, title: "", message: "", isError: false });

    const handleEvaluate = async (e) => {
        e.preventDefault();
        try {
            const response = await API.evaluateDispatch(dim, state.user.access_token);
            setResultsData(response); 
        } catch (err) {
            setModalAlert({ isOpen: true, title: "Evaluation Failed", message: err.message, isError: true });
        }
    };

    useEffect(() => {
        if (!resultsData?.options?.length) return;
        const best = [...resultsData.options].sort((a, b) => a.dispatch_cost_gst - b.dispatch_cost_gst)[0];
        setSelectedTransport(best);
    }, [resultsData]);

    const confirmTransport = async (provider) => {
        try {
            const response = await API.saveDispatchRecord(provider, state.user.access_token);
            setModalAlert({ isOpen: true, title: "Success", message: response.message || "Dispatch option saved successfully.", isError: false });
            setSelectedTransport(provider);
            setTimeout(() => window.print(), 800); 
        } catch (err) {
            setModalAlert({ isOpen: true, title: "System Halt", message: err.message, isError: true });
        }
    };

    return (
        <div className="frappe-card">
            <div className="system-header">
                <div>
                    <h2>Freight Logistics Evaluator</h2>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Contract Rate Comparison</p>
                </div>
            </div>

            <form onSubmit={handleEvaluate} style={{ background: "var(--bg-main)", padding: "20px", borderRadius: "var(--radius-sm)", marginBottom: "20px", border: "1px solid var(--border-light)" }}>
                <h4>Shipment Details</h4>

                <div className="form-grid-layout" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                    <label className="input-label">Width:</label>
                    <input className="form-input" value={dim.width} onChange={(e) => setDim({ ...dim, width: +e.target.value })} />
                    <label className="input-label">Height:</label>
                    <input className="form-input" value={dim.height} onChange={(e) => setDim({ ...dim, height: +e.target.value })} />
                    <label className="input-label">Depth:</label>
                    <input className="form-input" value={dim.depth} onChange={(e) => setDim({ ...dim, depth: +e.target.value })} />
                    <label className="input-label">Weight (kg):</label>
                    <input className="form-input" value={dim.weight} onChange={(e) => setDim({ ...dim, weight: +e.target.value })} />
                    <label className="input-label">Invoice Value</label>
                    <input className="form-input" value={dim.invoice_value} onChange={(e) => setDim({ ...dim, invoice_value: +e.target.value })} />
                    
                    {/* Source City Removed */}
                    
                    <label className="input-label">Destination City (CITY ONLY!):</label>
                    <input className="form-input" value={dim.destination_city} onChange={(e) => setDim({ ...dim, destination_city: e.target.value })} />
                    <label className="input-label">Distance from hub to destination:</label>
                    <input className="form-input" value={dim.delivery_distance} onChange={(e) => setDim({ ...dim, delivery_distance: +e.target.value })} />
                    <label className="input-label">Diesel Price:</label>
                    <input className="form-input" value={dim.diesel_price} onChange={(e) => setDim({ ...dim, diesel_price: +e.target.value })} />
                </div>

                <div style={{ marginTop: "15px" }}>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: "12px", background: showHamali ? "#eee" : "transparent" }} onClick={() => setShowHamali(!showHamali)}>
                        {showHamali ? "− Hide Hamali Charges" : "+ Add Hamali Charges(Confirm from Sachin Sir)"}
                    </button>
                    {showHamali && (
                        <div style={{ marginTop: "10px", padding: "15px", background: "var(--bg-surface)", border: "1px dashed var(--brand-accent)", borderRadius: "var(--radius-sm)" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                                <div><label className="input-label" style={{ fontSize: "11px" }}>Hamali Detail</label><input className="form-input" placeholder="e.g., Loading" value={dim.hamali_detail} onChange={(e) => setDim({ ...dim, hamali_detail: e.target.value })} /></div>
                                <div><label className="input-label" style={{ fontSize: "11px" }}>Cost Amount (₹)</label><input className="form-input" type="number" value={dim.hamali_cost} onChange={(e) => setDim({ ...dim, hamali_cost: +e.target.value })} /></div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 15 }}>
                    <label><input type="checkbox" checked={includeNew} onChange={(e) => setIncludeNew(e.target.checked)} /> Include Walk-In Transporter</label>
                </div>

                <button className="btn btn-primary" type="submit" style={{ marginTop: 20 }}>Evaluate Dispatch Options</button>
            </form>

            {resultsData?.options?.length > 0 && (
                <div>
                    <h4>Total Options: {resultsData.options.length}</h4>
                    <div style={{ display: "flex", gap: 15, overflowX: "auto" }}>
                        {resultsData.options.map((opt, idx) => {
                            const isBest = selectedTransport?.partner_name === opt.partner_name;
                            return (
                                <div key={idx} style={{ minWidth: 280, padding: 15, border: isBest ? "2px solid var(--brand-success)" : "1px solid var(--border-subtle)", background: isBest ? "#eaffea" : "var(--bg-surface)" }}>
                                    <strong style={{ color: "var(--brand-accent)" }}>Partners Evaluation:</strong>
                                    <h4>{opt.partner_name}{isBest && <span style={{marginLeft: 8, padding: "2px 8px", fontSize: "11px", fontWeight: 600, borderRadius: "12px", background: "var(--brand-success)", color: "#fff", display: "inline-block", verticalAlign: "middle" }}>🟢 Cheapest</span>}</h4>
                                    <p>Cost: ₹{opt.dispatch_cost_gst}</p>
                                    <details style={{ marginTop: 10 }}>
                                        <summary>Cost Breakdown</summary>
                                        <div style={{ marginTop: 10, fontSize: "13px", display: "grid", gridTemplateColumns: "1fr auto", gap: "6px" }}>
                                            {/* Source Zone Removed */}
                                            <span>Destination Zone</span><strong>{opt.destination_zone}</strong>
                                            <span>Chargeable Weight</span><strong>{opt.chargeable_weight} kg</strong>
                                            <span>Basic Freight</span><strong>₹{opt.basic_freight}</strong>
                                            <span>Fuel Charge</span><strong>₹{opt.fuel_charge}</strong>
                                            <span>Documentation Charge</span><strong>₹{opt.documentation_charge}</strong>
                                            <span>FOV Charge</span><strong>₹{opt.fov_charge}</strong>
                                            <span>ODA Charge</span><strong>₹{opt.oda_charge}</strong>
                                            {opt.hamali_cost > 0 && (<><span style={{color: "var(--brand-accent)"}}>{opt.hamali_detail || "Hamali Charges"}</span><strong style={{color: "var(--brand-accent)"}}>₹{opt.hamali_cost}</strong></>)}
                                            <span>Charges before Taxes</span><strong>₹{opt.subtotal}</strong>
                                            <span>Total Cost after Taxes</span><strong>₹{opt.dispatch_cost_gst}</strong>
                                        </div>
                                    </details>
                                    <button className="btn btn-success" onClick={() => confirmTransport(opt)}>Select</button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Print Intent Modal */}
            {selectedTransport && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h3>Confirmed Transport</h3>
                        <p>{selectedTransport.partner_name}</p>
                        <p>Final Cost: ₹{selectedTransport.dispatch_cost_gst}</p>
                        <button className="btn btn-primary" onClick={() => confirmTransport(selectedTransport)}>Print Invoice</button>
                        <button className="btn btn-secondary" onClick={() => setSelectedTransport(null)}>Close</button>
                    </div>
                </div>
            )}

            {/* User-Defined Alert Modal */}
            {modalAlert.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ borderTop: `4px solid ${modalAlert.isError ? "var(--brand-danger)" : "var(--brand-success)"}` }}>
                        <h3 style={{ color: modalAlert.isError ? "var(--brand-danger)" : "var(--brand-success)" }}>
                            {modalAlert.title}
                        </h3>
                        <p style={{ margin: "15px 0" }}>{modalAlert.message}</p>
                        <button className="btn btn-secondary" onClick={() => setModalAlert({ isOpen: false, title: "", message: "", isError: false })}>Acknowledge</button>
                    </div>
                </div>
            )}
        </div>
    );
}