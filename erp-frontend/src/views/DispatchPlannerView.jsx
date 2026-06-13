import { useState, useEffect } from "react";
import API from "../api/api";
export default function DispatchPlannerView({ state }) {
    const [dim, setDim] = useState({
        width: 0, height: 0, depth: 0, weight: 0, invoice_value: 0, source_state: "Mumbai", destination_city: "", delivery_distance: 0, diesel_price: 98, cft_charge: 0, min_weight: 0, hamali_detail: "", hamali_cost: 0});

    const [newPartner, setNewPartner] = useState({
        name: "Walk-In Transporter",
        destination_rate: 0,
        fuel_charge_percentage: 0,
        documentation_charge: 0,
        delivery_destination_charge: 0,
        freight_invoice_brokerage_percentage: 0,
        hawala_charges: 0,
        hamali_detail: "",
        hamali_cost: 0
    });

    const [showHamali, setShowHamali] = useState(false);
    const [includeNew, setIncludeNew] = useState(false);
    const [resultsData, setResultsData] = useState(null);
    const [selectedTransport, setSelectedTransport] = useState(null);

    // ------------------------------------------------------------
    // FETCH + EVALUATE
    // ------------------------------------------------------------
    const handleEvaluate = async (e) => {
        e.preventDefault();
        try {
            // Mapping UI inputs to Backend API requirements
            const response = await API.evaluateDispatch(dim, state.user.access_token);
            setResultsData(response); // Sorted list from backend
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    // ------------------------------------------------------------
    // AUTO SELECT BEST WHEN DATA UPDATES
    // ------------------------------------------------------------
    useEffect(() => {
        if (!resultsData?.options?.length) return;

        const best = [...resultsData.options].sort(
            (a, b) => a.dispatch_cost_gst - b.dispatch_cost_gst
        )[0];

        setSelectedTransport(best);
    }, [resultsData]);

    // ------------------------------------------------------------
    // CONFIRM TRANSPORT
    // ------------------------------------------------------------
    const confirmTransport = (provider) => {
        setSelectedTransport(provider);
        setTimeout(() => window.print(), 300);
    };

    // ------------------------------------------------------------
    // UI
    // ------------------------------------------------------------
    return (
        <div className="frappe-card">

            {/* HEADER */}
            <div className="system-header">
                <div>
                    <h2>Freight Logistics Evaluator</h2>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                        Contract Rate Comparison
                    </p>
                </div>
            </div>

            {/* FORM */}
            <form
                onSubmit={handleEvaluate}
                style={{
                    background: "var(--bg-main)",
                    padding: "20px",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: "20px",
                    border: "1px solid var(--border-light)"
                }}
            >
                <h4>Shipment Details</h4>

                <div className="form-grid-layout" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                    <label className="input-label">Width:</label>
                    <input className="form-input" placeholder="Width"
                        value={dim.width}
                        onChange={(e) => setDim({ ...dim, width: +e.target.value })}
                    />
                    <label className="input-label">Height:</label>
                    <input className="form-input" placeholder="Height"
                        value={dim.height}
                        onChange={(e) => setDim({ ...dim, height: +e.target.value })}
                    />
                    <label className="input-label">Depth:</label>
                    <input className="form-input" placeholder="Depth"
                        value={dim.depth}
                        onChange={(e) => setDim({ ...dim, depth: +e.target.value })}
                    />
                    <label className="input-label">Weight:</label>
                    <input className="form-input" placeholder="Weight (kg)"
                        value={dim.weight}
                        onChange={(e) => setDim({ ...dim, weight: +e.target.value })}
                    />
                    <label className="input-label">Invoice Value</label>
                    <input className="form-input" placeholder="Invoice Value"
                        value={dim.invoice_value}
                        onChange={(e) => setDim({ ...dim, invoice_value: +e.target.value })}
                    />
                    <label className="input-label">Source City:</label>
                    <input className="form-input" placeholder="Source State"
                        value={dim.source_state}
                        onChange={(e) => setDim({ ...dim, source_state: e.target.value })}
                    />
                    <label className="input-label">Destination City(CITY ONLY!):</label>
                    <input className="form-input" placeholder="Destination City"
                        value={dim.destination_city}
                        onChange={(e) => setDim({ ...dim, destination_city: e.target.value })}
                    />
                    <label className="input-label">Distance from hub to destination:</label>
                    <input className="form-input" placeholder="Distance (km)"
                        value={dim.delivery_distance}
                        onChange={(e) => setDim({ ...dim, delivery_distance: +e.target.value })}
                    />
                    <label className="input-label">Diesel Price:</label>
                    <input className="form-input" placeholder="Diesel Price"
                        value={dim.diesel_price}
                        onChange={(e) => setDim({ ...dim, diesel_price: +e.target.value })}
                    />
                </div>

                <div style={{ marginTop: "15px" }}>
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ fontSize: "12px", background: showHamali ? "#eee" : "transparent" }}
                        onClick={() => setShowHamali(!showHamali)}
                    >
                        {showHamali ? "− Hide Hamali Charges" : "+ Add Hamali Charges(Confirm from Sachin Sir)"}
                    </button>

                    {showHamali && (
                        <div style={{ marginTop: "10px", padding: "15px", background: "var(--bg-surface)", border: "1px dashed var(--brand-accent)", borderRadius: "var(--radius-sm)" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                                <div>
                                    <label className="input-label" style={{ fontSize: "11px" }}>Hamali Detail</label>
                                    <input className="form-input" placeholder="e.g., Loading/Unloading" value={dim.hamali_detail} onChange={(e) => setDim({ ...dim, hamali_detail: e.target.value })} />
                                </div>
                                <div>
                                    <label className="input-label" style={{ fontSize: "11px" }}>Cost Amount (₹)</label>
                                    <input className="form-input" type="number" value={dim.hamali_cost} onChange={(e) => setDim({ ...dim, hamali_cost: +e.target.value })} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* WALK-IN TOGGLE */}
                <div style={{ marginTop: 15 }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={includeNew}
                            onChange={(e) => setIncludeNew(e.target.checked)}
                        />
                        {" "} Include Walk-In Transporter
                    </label>
                </div>

                {/* WALK-IN FORM */}
                {includeNew && (
                    <div className="form-grid-layout"
                        style={{
                            gridTemplateColumns: "repeat(4, 1fr)",
                            marginTop: 15,
                            padding: 15,
                            background: "var(--bg-surface)"
                        }}
                    >
                        <label className="input-label">Logistics name:</label>
                        <input className="form-input"
                            value={newPartner.name}
                            onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                            placeholder="Partner Name"
                        />
                        <label className="input-label">Destination Rate:</label>
                        <input className="form-input"
                            placeholder="Destination Rate"
                            onChange={(e) => setNewPartner({ ...newPartner, destination_rate: +e.target.value })}
                        />
                        <label className="input-label">Fuel Surcharge Rate:</label>
                        <input className="form-input"
                            placeholder="Fuel %"
                            onChange={(e) => setNewPartner({ ...newPartner, fuel_charge_percentage: +e.target.value })}
                        />
                        <label className="input-label">Documentation Charge:</label>
                        <input className="form-input"
                            placeholder="Docs Charge"
                            onChange={(e) => setNewPartner({ ...newPartner, documentation_charge: +e.target.value })}
                        />
                        <label className="input-label">Delivery charge from factory to hub:</label>
                        <input className="form-input"
                            placeholder="Delivery Charge"
                            onChange={(e) => setNewPartner({ ...newPartner, delivery_destination_charge: +e.target.value })}
                        />
                        <label className="input-label">Broker %:</label>
                        <input className="form-input"
                            placeholder="Brokerage %"
                            onChange={(e) => setNewPartner({ ...newPartner, freight_invoice_brokerage_percentage: +e.target.value })}
                        />
                        <div style={{ marginTop: "20px", padding: "15px", background: "var(--bg-surface)", border: "1px dashed var(--brand-accent)", borderRadius: "var(--radius-sm)" }}>
                            <label className="input-label" style={{ color: "var(--brand-accent)", fontWeight: "bold", marginBottom: "10px", display: "block" }}>
                                Hamali Charges (Ask from Sachin Sir)
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                                <div>
                                    <label className="input-label" style={{ fontSize: "11px" }}>Hamali Detail</label>
                                    <input className="form-input" placeholder="e.g., Loading/Unloading" value={dim.hamali_detail} onChange={(e) => setDim({ ...dim, hamali_detail: e.target.value })} />
                                </div>
                                <div>
                                    <label className="input-label" style={{ fontSize: "11px" }}>Cost Amount (₹)</label>
                                    <input className="form-input" type="number" value={dim.hamali_cost} onChange={(e) => setDim({ ...dim, hamali_cost: +e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <button className="btn btn-primary" type="submit" style={{ marginTop: 20 }}>
                    Evaluate Dispatch Options
                </button>
            </form>

            {/* RESULTS */}
            {resultsData?.options?.length > 0 && (
                <div>

                    <h4>
                        Total Options: {resultsData.options.length}
                    </h4>

                    <div style={{
                        display: "flex",
                        gap: 15,
                        overflowX: "auto"
                    }}>
                        {resultsData.options.map((opt, idx) => {
                            const isBest = selectedTransport?.partner_name === opt.partner_name;

                            return (
                                <div key={idx}
                                    style={{
                                        minWidth: 280,
                                        padding: 15,
                                        border: isBest ? "2px solid var(--brand-success)" : "1px solid var(--border-subtle)",
                                        background: isBest ? "#eaffea" : "var(--bg-surface)"
                                    }}
                                >
                                    <strong style={{ color: "var(--brand-accent)" }}>Partners Evaluation:</strong>

                                    <h4>
                                        {opt.partner_name}
                                        {isBest && (
                                            <span style={{marginLeft: 8, padding: "2px 8px", fontSize: "11px", fontWeight: 600, borderRadius: "12px", background: "var(--brand-success)", color: "#fff", display: "inline-block", verticalAlign: "middle" }}>
                                                🟢 Cheapest
                                            </span>
                                        )}
                                    </h4>
                                    
                                    <p>Cost: ₹{opt.dispatch_cost_gst}</p>
                                    <details style={{ marginTop: 10 }}>

                                        <summary>
                                            Cost Breakdown
                                        </summary>

                                        <div
                                            style={{
                                                marginTop: 10,
                                                fontSize: "13px",
                                                display: "grid",
                                                gridTemplateColumns: "1fr auto",
                                                gap: "6px"
                                            }}
                                        >

                                            <span>Source Zone</span>
                                            <strong>{opt.source_zone}</strong>

                                            <span>Destination Zone</span>
                                            <strong>{opt.destination_zone}</strong>

                                            <span>Chargeable Weight</span>
                                            <strong>{opt.chargeable_weight} kg</strong>

                                            <span>Basic Freight</span>
                                            <strong>₹{opt.basic_freight}</strong>

                                            <span>Fuel Charge</span>
                                            <strong>₹{opt.fuel_charge}</strong>

                                            <span>FOV Charge</span>
                                            <strong>₹{opt.fov_charge}</strong>

                                            <span>ODA Charge</span>
                                            <strong>₹{opt.oda_charge}</strong>
                                            
                                            {opt.hamali_cost > 0 && (<>
                                                <span style={{color: "var(--brand-accent)"}}>{opt.hamali_detail || "Hamali Charges"}</span>
                                                <strong style={{color: "var(--brand-accent)"}}>₹{opt.hamali_cost}</strong>
                                                </>
                                            )}
                                            
                                            <span>Charges before Taxes</span>
                                            <strong>₹{opt.subtotal}</strong>
                                            
                                            <span>Total Cost after Taxes</span>
                                            <strong>₹{opt.dispatch_cost_gst}</strong>

                                        </div>

                                    </details>
                                    <button
                                        className="btn btn-success"
                                        onClick={() => confirmTransport(opt)}
                                    >
                                        Select
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODAL */}
            {selectedTransport && (
                <div className="modal-overlay">
                    <div className="modal-box">

                        <h3>Confirmed Transport</h3>

                        <p>
                            {selectedTransport.partner_name}
                        </p>

                        <p>
                            Final Cost: ₹{selectedTransport.dispatch_cost_gst}
                        </p>

                        <button
                            className="btn btn-primary"
                            onClick={() => confirmTransport(selectedTransport)}
                        >
                            Print Invoice
                        </button>

                        <button
                            className="btn btn-secondary"
                            onClick={() => setSelectedTransport(null)}
                        >
                            Close
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
}