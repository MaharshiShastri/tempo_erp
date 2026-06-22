import { useState, useEffect } from "react";
import { FiArrowRight, FiTruck, FiMapPin, FiCheckCircle, FiBox, FiMap } from "react-icons/fi";

export default function DispatchPlannerView({ state }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [activePartners, setActivePartners] = useState([]);
    
    // Background AI State
    const [zonePromise, setZonePromise] = useState(null);
    const [identifiedZones, setIdentifiedZones] = useState(null);
    const [debugData, setDebugData] = useState(null);
    const [partnerDistances, setPartnerDistances] = useState({});
    const [results, setResults] = useState([]);

    const [dispatchParams, setDispatchParams] = useState({
        destination_city: "",
        destination_state: "",
        weight_kg: "",
        dimensions_l_in: "",
        dimensions_w_in: "",
        dimensions_h_in: "",
        invoice_value: "",
        hamali_charges: ""
    });

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const response = await fetch("/api/v1/dispatch/partners/active", {
                    headers: { 'Authorization': `Bearer ${state.user.access_token}` }
                });

                const data = await response.json();

                // ✅ FIX: ensure array always
                const partnersArray = Array.isArray(data)
                    ? data
                    : (data?.partners || data?.data || []);

                setActivePartners(partnersArray);

                const distMap = {};
                partnersArray.forEach(p => {
                    if (p?.id !== undefined) {
                        distMap[p.id] = "";
                    }
                });

                setPartnerDistances(distMap);

            } catch (err) {
                console.error("Failed to load partners", err);
                setActivePartners([]); // safe fallback
            }
        };

        fetchPartners();
    }, [state.user.access_token]);

    // Dynamically checks for admin-provided link, falls back to Google
    const getPartnerLink = (partnerObj) => {
        if (partnerObj.partner_link && partnerObj.partner_link.trim() !== "") {
            return partnerObj.partner_link;
        }
        return `https://www.google.com/search?q=${encodeURIComponent(partnerObj.name)}+pincode+distance+calculator`;
    };

    // STEP 1 -> STEP 2: Triggers Background AI Groq call
    const startBackgroundZoneIdentification = (e) => {
        e.preventDefault();
        setStep(2);
        
        // Fire request to Groq without awaiting it here
        const promise = fetch("/api/v1/dispatch/pre-identify-zones", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${state.user.access_token}` 
            },
            body: JSON.stringify({
                city: dispatchParams.destination_city,
                state: dispatchParams.destination_state
            })
        }).then(res => res.json())
          .then(data => setIdentifiedZones(data));

        setZonePromise(promise);
    };

    // STEP 2 -> STEP 3
    const handleMoveToDistances = (e) => {
        e.preventDefault();
        setStep(3);
    };

    const handleDistanceChange = (partnerId, value) => {
        setPartnerDistances(prev => ({ ...prev, [partnerId]: value }));
    };

    // FINAL CALCULATE
    const handleCalculate = async () => {
        setLoading(true);

        try {
            // Safety measure: If Groq hasn't finished in the background yet, wait for it now.
            if (!identifiedZones && zonePromise) {
                if (state.setAlertMessage) {
                    state.setAlertMessage("⏳ Waiting for AI to finalize regional routing...");
                    state.setIsAlertOpen(true);
                }
                await zonePromise; 
            }

            const payload = {
                ...dispatchParams,
                weight_kg: parseFloat(dispatchParams.weight_kg) || 0,
                dimensions_l_in: parseFloat(dispatchParams.dimensions_l_in) || 0,
                dimensions_w_in: parseFloat(dispatchParams.dimensions_w_in) || 0,
                dimensions_h_in: parseFloat(dispatchParams.dimensions_h_in) || 0,
                invoice_value: parseFloat(dispatchParams.invoice_value) || 0,
                hamali_charges: parseFloat(dispatchParams.hamali_charges) || 0,
                partner_distances: partnerDistances,
                pre_identified_zones: identifiedZones // Pass the background-mapped zones
            };

            const response = await fetch("/api/v1/dispatch/calculate", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${state.user.access_token}` 
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Calculation engine failed.");
            
            const data = await response.json();
            const safeResults = Array.isArray(data) ? data : (data?.results || data?.data || [])
            setResults(safeResults);
            console.log("DISPATCH DEBUG:", data.debug);
            setStep(4);
            setDebugData(data?.debug || null);
            
        } catch (err) {
            if (state.setAlertMessage) {
                state.setAlertMessage("Error: " + err.message);
                state.setIsAlertOpen(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setIdentifiedZones(null);
        setZonePromise(null);
        setResults([]);
    };

    return (
        <div className="frappe-card" style={{ maxWidth: 1000, margin: "0 auto", padding: 30 }}>
            
            {/* Header / Progress Bar */}
            <div className="system-header" style={{ marginBottom: "20px" }}>
                <div>
                    <h3><FiTruck style={{ marginRight: '8px' }}/> Smart Dispatch Planner</h3>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>
                        AI-Driven Multi-Carrier Freight Optimizer
                    </p>
                </div>
                {step < 4 && (
                    <div style={{ fontSize: "12px", background: "var(--bg-main)", padding: "6px 12px", borderRadius: "15px", fontWeight: "bold" }}>
                        Step {step} of 3
                    </div>
                )}
            </div>

            {/* STEP 1: CITY & STATE */}
            {step === 1 && (
                <form onSubmit={startBackgroundZoneIdentification} style={{ animation: "fadeIn 0.3s ease-in-out" }}>
                    <div style={{ padding: "15px", background: "var(--bg-surface)", borderLeft: "4px solid var(--brand-accent)", borderRadius: "var(--radius-sm)", marginBottom: "20px" }}>
                        <h4 style={{ margin: "0 0 5px 0", color: "var(--text-primary)" }}>Destination Details</h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Enter the destination to initiate AI zone mapping in the background.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", background: "var(--bg-main)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="input-label">Destination City *</label>
                            <input required className="form-input" value={dispatchParams.destination_city} onChange={e => setDispatchParams({...dispatchParams, destination_city: e.target.value})} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="input-label">Destination State *</label>
                            <input required className="form-input" value={dispatchParams.destination_state} onChange={e => setDispatchParams({...dispatchParams, destination_state: e.target.value})} />
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "15px" }}>
                            Next Step <FiArrowRight />
                        </button>
                    </div>
                </form>
            )}

            {/* STEP 2: PARCEL PARAMETERS */}
            {step === 2 && (
                <form onSubmit={handleMoveToDistances} style={{ animation: "fadeIn 0.3s ease-in-out" }}>
                    <div style={{ padding: "15px", background: "var(--bg-surface)", borderLeft: "4px solid var(--brand-success)", borderRadius: "var(--radius-sm)", marginBottom: "20px" }}>
                        <h4 style={{ margin: "0 0 5px 0", color: "var(--brand-success)", display: "flex", alignItems: "center", gap: "6px" }}><FiBox /> Parcel Specifications</h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>AI is currently identifying transport zones. Please enter the parcel details.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", background: "var(--bg-main)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="input-label">Actual Weight (KG) *</label>
                            <input required type="number" step="0.1" className="form-input" value={dispatchParams.weight_kg} onChange={e => setDispatchParams({...dispatchParams, weight_kg: e.target.value})} />
                        </div>
                        
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="input-label">Dimensions (L x W x H in Inches) *</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input required type="number" placeholder="L (in)" className="form-input" value={dispatchParams.dimensions_l_in} onChange={e => setDispatchParams({...dispatchParams, dimensions_l_in: e.target.value})} />
                                <input required type="number" placeholder="W (in)" className="form-input" value={dispatchParams.dimensions_w_in} onChange={e => setDispatchParams({...dispatchParams, dimensions_w_in: e.target.value})} />
                                <input required type="number" placeholder="H (in)" className="form-input" value={dispatchParams.dimensions_h_in} onChange={e => setDispatchParams({...dispatchParams, dimensions_h_in: e.target.value})} />
                            </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="input-label">Invoice Value (₹) *</label>
                            <input required type="number" step="0.01" className="form-input" value={dispatchParams.invoice_value} onChange={e => setDispatchParams({...dispatchParams, invoice_value: e.target.value})} />
                        </div>
                        
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="input-label">Hamali/Loading Charges (₹)</label>
                            <input type="number" step="0.01" className="form-input" placeholder="0.00" value={dispatchParams.hamali_charges} onChange={e => setDispatchParams({...dispatchParams, hamali_charges: e.target.value})} />
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", borderTop: "1px solid var(--border-light)", paddingTop: "20px" }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                        <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "15px" }}>
                            Proceed to Distance Inputs <FiArrowRight />
                        </button>
                    </div>
                </form>
            )}

            {/* STEP 3: INDIVIDUAL PARTNER DISTANCE CARDS */}
            {step === 3 && (
                <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
                    <div style={{ marginBottom: "20px", padding: "15px", background: "var(--bg-surface)", borderLeft: "4px solid var(--brand-accent)", borderRadius: "var(--radius-sm)" }}>
                        <h4 style={{ margin: "0 0 5px 0", color: "var(--text-primary)" }}>Partner-Specific Distances Required</h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                            Distances vary by company hub. Use the provided links to verify exact pincode distances.
                        </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "15px", marginBottom: "25px" }}>
                        {activePartners.map(p => (
                            <div key={p.id} style={{ background: "var(--bg-main)", border: "1px solid var(--border-light)", padding: "20px", borderRadius: "var(--radius-md)" }}>
                                <h4 style={{ margin: "0 0 5px 0", fontSize: "16px", color: "var(--text-primary)" }}>{p.name}</h4>
                                
                                {/* DYNAMIC PARTNER LINK INJECTED HERE */}
                                <a 
                                    href={getPartnerLink(p)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    style={{ fontSize: "11px", color: "var(--brand-accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "15px", background: "rgba(36, 144, 239, 0.1)", padding: "4px 8px", borderRadius: "4px" }}
                                >
                                    <FiMapPin /> Open Calculator Link
                                </a>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="input-label" style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                                        Find and enter the distance by clicking on the link above
                                    </label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        placeholder="Distance in KM"
                                        style={{ marginTop: "5px" }}
                                        value={partnerDistances[p.id]} 
                                        onChange={e => handleDistanceChange(p.id, e.target.value)} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", borderTop: "1px solid var(--border-light)", paddingTop: "20px" }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                        <button type="button" className="btn btn-success" onClick={handleCalculate} disabled={loading} style={{ padding: "12px 24px", fontSize: "15px", fontWeight: "bold" }}>
                            {loading ? "⏳ Finalizing..." : <><FiCheckCircle style={{ marginRight: '6px' }}/> Calculate Best Freight Options</>}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 4: RESULTS */}
            {step === 4 && (
                <div style={{ animation: "fadeIn 0.5s ease-in-out" }}>
                    {results.length === 0 ? (
                        <div style={{ padding: "30px", textAlign: "center", color: "var(--brand-danger)", background: "var(--warning-row)", borderRadius: "var(--radius-md)" }}>
                            No viable dispatch partners found for this region/weight combination.
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: "15px" }}>
                            {(Array.isArray(results) ? results : []).map((r, idx) => (
                                <div key={idx} style={{ 
                                    border: idx === 0 ? "2px solid var(--brand-success)" : "1px solid var(--border-light)", 
                                    borderRadius: "var(--radius-md)", 
                                    padding: "20px",
                                    background: idx === 0 ? "rgba(16, 185, 129, 0.03)" : "var(--bg-surface)",
                                    position: "relative"
                                }}>
                                    {idx === 0 && (
                                        <span style={{ position: "absolute", top: "-12px", right: "20px", background: "var(--brand-success)", color: "#fff", padding: "4px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>
                                            Most Cost Effective
                                        </span>
                                    )}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", paddingBottom: "15px", borderBottom: "1px solid var(--border-light)" }}>
                                        <div>
                                            <h3 style={{ margin: "0 0 5px 0", color: "var(--text-primary)" }}>{r.partner_name}</h3>
                                            <span style={{ fontSize: "12px", background: "var(--bg-main)", padding: "4px 8px", borderRadius: "4px", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                                                Identified Zone: <strong>{r.zone_code}</strong>
                                            </span>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: "24px", fontWeight: "bold", color: idx === 0 ? "var(--brand-success)" : "var(--text-primary)" }}>
                                                ₹{(r.total_cost ?? 0).toFixed(2)}
                                            </div>
                                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Chargeable Wt: {r.chargeable_weight} KG</div>
                                        </div>
                                    </div>
                                    {debugData && (
                                        <pre style={{ fontSize: 11, background: "#111", color: "#0f0", padding: 10 }}>
                                            {JSON.stringify(debugData, null, 2)}
                                        </pre>
                                    )}

                                    <details>
                                        <summary>View Financial Breakdown</summary>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px", marginTop: "10px", padding: "10px", background: "var(--bg-main)", borderRadius: "var(--radius-sm)" }}>
                                            <span>Base Freight:</span> <strong>₹{(r.breakdown?.freight ?? 0).toFixed(2)}</strong>
                                            {/* FUEL SURCHARGE RENDERED HERE */}
                                            <span>Fuel Surcharge:</span> <strong>₹{(r.breakdown?.fuel ?? 0).toFixed(2) || "0.00"}</strong>
                                            <span>ODA Charge:</span> <strong>₹{(r.breakdown?.oda ?? 0).toFixed(2)}</strong>
                                            <span>Documentation:</span> <strong>₹{(r.breakdown?.doc ?? 0).toFixed(2)}</strong>
                                            <span>FOV (Risk):</span> <strong>₹{(r.breakdown?.fov ?? 0).toFixed(2)}</strong>
                                            <span>Hamali:</span> <strong>₹{(r.breakdown?.hamali ?? 0).toFixed(2)}</strong>
                                            <span>GST Applicable:</span> <strong>₹{(r.breakdown?.gst ?? 0).toFixed(2)}</strong>
                                        </div>
                                    </details>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ marginTop: "25px", textAlign: "right" }}>
                        <button className="btn btn-secondary" onClick={resetForm}>Start New Query</button>
                    </div>
                </div>
            )}
        </div>
    );
}