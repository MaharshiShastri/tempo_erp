import { useState, useEffect } from "react";
import API from "../api/api";

export default function LogisticsPartnerEntryView({ state }) {
    // --- 1. Top Level State ---
    const [availablePartners, setAvailablePartners] = useState([]);
    const [selectedPartnerId, setSelectedPartnerId] = useState("");
    
    // We store the baseline data stringified so we can easily check if the user has made changes
    const [originalPayloadString, setOriginalPayloadString] = useState("{}");

    // --- 2. Form State ---
    const defaultPartner = {
        name: "", cft_factor: 10.0, minimum_weight: 0.0, minimum_freight_value: 0.0,
        documentation_charge: 0.0, fov_percentage: 0.0, hawala_charges: 0.0, gst_percentage: 18.0
    };

    const [partner, setPartner] = useState(defaultPartner);
    const [zones, setZones] = useState([]);
    const [rates, setRates] = useState([]);
    const [fuelMatrix, setFuelMatrix] = useState([]);
    
    // ODA 2D Matrix State
    const [odaDistances, setOdaDistances] = useState([]); // Y-Axis (Rows)
    const [odaWeights, setOdaWeights] = useState([]);     // X-Axis (Columns)
    const [odaCharges, setOdaCharges] = useState({});     // { 'distId_weightId': chargeValue }

    // --- 3. Initialization ---
    useEffect(() => {
        loadPartnersList();
    }, []);

    const loadPartnersList = async () => {
        try {
            const data = await API.getPartners(state.user.access_token);
            setAvailablePartners(data || []);
        } catch (err) {
            console.error("Failed to fetch partner list", err);
        }
    };

    // --- 4. Centralized Payload Builder (Serialization) ---
    // This function compiles the messy UI state into the exact JSON your backend expects.
    const buildCurrentPayload = () => {
        const compiledOdaMatrix = [];
        
        odaDistances.forEach(dist => {
            odaWeights.forEach(wt => {
                const chargeVal = odaCharges[`${dist.id}_${wt.id}`];
                if (chargeVal !== undefined && chargeVal !== "" && chargeVal !== null) {
                    compiledOdaMatrix.push({
                        km_from: parseFloat(dist.from) || 0,
                        km_to: parseFloat(dist.to) || 0,
                        weight_from: parseFloat(wt.from) || 0,
                        weight_to: parseFloat(wt.to) || 0,
                        oda_charge: parseFloat(chargeVal) || 0
                    });
                }
            });
        });

        return {
            name: partner.name || "",
            cft_factor: parseFloat(partner.cft_factor) || 0,
            minimum_weight: parseFloat(partner.minimum_weight) || 0,
            minimum_freight_value: parseFloat(partner.minimum_freight_value) || 0,
            documentation_charge: parseFloat(partner.documentation_charge) || 0,
            fov_percentage: parseFloat(partner.fov_percentage) || 0,
            hawala_charges: parseFloat(partner.hawala_charges) || 0,
            gst_percentage: parseFloat(partner.gst_percentage) || 0,
            
            zones: zones.filter(z => z.zone_code).map(z => ({
                zone_code: z.zone_code.trim(),
                zone_name: (z.zone_name || "").trim(),
                states: (z.states_raw || "").split(",").map(s => s.trim()).filter(Boolean)
            })),
            
            rates: rates.filter(r => r.source_zone && r.destination_zone).map(r => ({
                source_zone: r.source_zone.trim(),
                destination_zone: r.destination_zone.trim(),
                rate_per_kg: parseFloat(r.rate_per_kg) || 0
            })),
            
            fuel_matrix: fuelMatrix.filter(f => f.fuel_price_from !== "" && f.fuel_price_to !== "").map(f => ({
                fuel_price_from: parseFloat(f.fuel_price_from) || 0,
                fuel_price_to: parseFloat(f.fuel_price_to) || 0,
                surcharge_percentage: parseFloat(f.surcharge_percentage) || 0
            })),
            
            oda_matrix: compiledOdaMatrix
        };
    };

    // --- 5. Selection & Loading (Deserialization) ---
    const handlePartnerSelection = async (e) => {
        const id = e.target.value;
        setSelectedPartnerId(id);

        if (!id) {
            // Reset to clean slate
            setPartner(defaultPartner);
            setZones([]); setRates([]); setFuelMatrix([]);
            setOdaDistances([]); setOdaWeights([]); setOdaCharges({});
            setOriginalPayloadString(JSON.stringify(defaultPartner)); 
            return;
        }

        try {
            const profile = await API.getPartnerProfile(id, state.user.access_token);
            
            // 1. Populate Core
            setPartner({
                name: profile.name || "", cft_factor: profile.cft_factor ?? 10,
                minimum_weight: profile.minimum_weight ?? 0, minimum_freight_value: profile.minimum_freight_value ?? 0,
                documentation_charge: profile.documentation_charge ?? 0, fov_percentage: profile.fov_percentage ?? 0,
                hawala_charges: profile.hawala_charges ?? 0, gst_percentage: profile.gst_percentage ?? 18
            });

            // 2. Populate Standard Tables
            setZones(profile.zones?.map(z => ({ ...z, states_raw: z.states_raw || "" })) || []);
            setRates(profile.rates || []);
            setFuelMatrix(profile.fuel_matrix || []);

            // 3. Populate ODA 2D Matrix
            const loadedOda = profile.oda_matrix || [];
            const dMap = new Map();
            const wMap = new Map();
            const newCharges = {};

            loadedOda.forEach((o, idx) => {
                const dKey = `${o.km_from}-${o.km_to}`;
                const wKey = `${o.weight_from}-${o.weight_to}`;

                if (!dMap.has(dKey)) dMap.set(dKey, { id: `d_${idx}`, from: o.km_from, to: o.km_to });
                if (!wMap.has(wKey)) wMap.set(wKey, { id: `w_${idx}`, from: o.weight_from, to: o.weight_to });

                const rowId = dMap.get(dKey).id;
                const colId = wMap.get(wKey).id;
                newCharges[`${rowId}_${colId}`] = o.oda_charge;
            });

            setOdaDistances(Array.from(dMap.values()));
            setOdaWeights(Array.from(wMap.values()));
            setOdaCharges(newCharges);

            // Wait a micro-tick so states settle, then lock in the baseline for change detection
            setTimeout(() => {
                setOriginalPayloadString(JSON.stringify(buildCurrentPayload()));
            }, 0);

        } catch (err) {
            state.setAlertMessage("Failed to load partner profile.");
            state.setIsAlertOpen(true);
        }
    };

    // --- 6. Event Handlers ---
    const handleSave = async (e) => {
        e.preventDefault();
        const payload = buildCurrentPayload();

        try {
            if (selectedPartnerId) {
                await API.updateDispatchPartner(selectedPartnerId, payload, state.user.access_token);
                state.setAlertMessage("Transporter profile updated successfully.");
            } else {
                await API.saveDispatchPartner(payload, state.user.access_token);
                state.setAlertMessage("New Transporter profile created successfully.");
                setSelectedPartnerId(""); // reset UI
            }
            
            // Sync baseline so the Update button disappears again
            setOriginalPayloadString(JSON.stringify(payload));
            state.setAlertMessage("Partner configuration updated successfully.");
            state.setIsAlertOpen(true);
            loadPartnersList(); 
            
        } catch (err) {
            state.setAlertMessage("Database sync failed: " + err.message);
            state.setIsAlertOpen(true);
        }
    };

    // Standard Helpers
    const addRow = (setter, defaultObj) => setter(prev => [...prev, defaultObj]);
    const removeRow = (list, setter, idx) => setter(list.filter((_, i) => i !== idx));
    const handleTableChange = (list, setter, idx, field, val) => {
        const updated = [...list];
        updated[idx][field] = val;
        setter(updated);
    };

    // ODA Helpers
    const addOdaRow = () => setOdaDistances([...odaDistances, { id: `d_${Date.now()}`, from: "", to: "" }]);
    const addOdaCol = () => setOdaWeights([...odaWeights, { id: `w_${Date.now()}`, from: "", to: "" }]);
    const updateOdaAxis = (setter, list, id, field, val) => setter(list.map(item => item.id === id ? { ...item, [field]: val } : item));
    const updateOdaCharge = (dId, wId, val) => setOdaCharges(prev => ({ ...prev, [`${dId}_${wId}`]: val }));

    // Change Detection
    const hasChanges = JSON.stringify(buildCurrentPayload()) !== originalPayloadString;

    // --- 7. UI Render ---
    return (
        <div className="frappe-card" style={{ maxWidth: 1200, margin: "0 auto", padding: 25 }}>
            <div className="system-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>🚚 Master Logistics Onboarding Dashboard</h3>
                <select className="form-select-native" value={selectedPartnerId} onChange={handlePartnerSelection}>
                    <option value="">➕ Create New Transporter</option>
                    {availablePartners.map(p => <option key={p.id} value={p.id}>✏️ {p.name}</option>)}
                </select>
            </div>

            <form onSubmit={handleSave}>
                {/* 1. CORE PARAMS */}
                <h4 style={{ color: "var(--brand-accent)", marginTop: "20px" }}>Core Contract Parameters</h4>
                <div className="form-grid-layout" style={{ gap: "15px" }}>
                    <div className="form-group"><label className="input-label">Transporter Name</label><input required className="form-input" value={partner.name} onChange={e => setPartner({ ...partner, name: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">CFT Factor</label><input required type="number" step="0.01" className="form-input" value={partner.cft_factor} onChange={e => setPartner({ ...partner, cft_factor: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">Min Weight (KG)</label><input required type="number" className="form-input" value={partner.minimum_weight} onChange={e => setPartner({ ...partner, minimum_weight: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">Min Freight Value (₹)</label><input required type="number" className="form-input" value={partner.minimum_freight_value} onChange={e => setPartner({ ...partner, minimum_freight_value: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">Docs/GC Charge</label><input required type="number" className="form-input" value={partner.documentation_charge} onChange={e => setPartner({ ...partner, documentation_charge: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">FOV Risk (%)</label><input required type="number" step="0.01" className="form-input" value={partner.fov_percentage} onChange={e => setPartner({ ...partner, fov_percentage: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">Hawala Charge</label><input required type="number" className="form-input" value={partner.hawala_charges} onChange={e => setPartner({ ...partner, hawala_charges: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">GST Rate (%)</label><input required type="number" className="form-input" value={partner.gst_percentage} onChange={e => setPartner({ ...partner, gst_percentage: e.target.value })} /></div>
                </div>

                {/* 2. ZONES */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px" }}>
                    <h4 style={{ color: "var(--brand-accent)" }}>Zone Definitions</h4>
                    <button type="button" className="btn btn-secondary" onClick={() => addRow(setZones, { zone_code: "", zone_name: "", states_raw: "" })}>+ Add Zone</button>
                </div>
                <table style={{ width: "100%", marginBottom: "20px" }}>
                    <thead><tr style={{ textAlign: "left" }}><th>Code</th><th>Regions Served</th><th>States (Comma Separated)</th><th></th></tr></thead>
                    <tbody>
                        {zones.map((z, i) => (
                            <tr key={i}>
                                <td><input className="form-input" style={{ textTransform: "uppercase" }} value={z.zone_code} onChange={e => handleTableChange(zones, setZones, i, "zone_code", e.target.value)} /></td>
                                <td><input className="form-input" value={z.zone_name} onChange={e => handleTableChange(zones, setZones, i, "zone_name", e.target.value)} /></td>
                                <td><input className="form-input" value={z.states_raw} onChange={e => handleTableChange(zones, setZones, i, "states_raw", e.target.value)} /></td>
                                <td><button type="button" className="btn-text-danger" onClick={() => removeRow(zones, setZones, i)}>✕</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* 3. RATES */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px" }}>
                    <h4 style={{ color: "var(--brand-accent)" }}>Commercial Freight Rates</h4>
                    <button type="button" className="btn btn-secondary" onClick={() => addRow(setRates, { source_zone: "", destination_zone: "", rate_per_kg: "" })}>+ Add Rate</button>
                </div>
                <table style={{ width: "100%", marginBottom: "20px" }}>
                    <thead><tr style={{ textAlign: "left" }}><th>From Zone</th><th>To Zone</th><th>Rate Per Kg (₹)</th><th></th></tr></thead>
                    <tbody>
                        {rates.map((r, i) => (
                            <tr key={i}>
                                <td><input className="form-input" style={{ textTransform: "uppercase" }} value={r.source_zone} onChange={e => handleTableChange(rates, setRates, i, "source_zone", e.target.value)} /></td>
                                <td><input className="form-input" style={{ textTransform: "uppercase" }} value={r.destination_zone} onChange={e => handleTableChange(rates, setRates, i, "destination_zone", e.target.value)} /></td>
                                <td><input className="form-input" type="number" step="0.01" value={r.rate_per_kg} onChange={e => handleTableChange(rates, setRates, i, "rate_per_kg", e.target.value)} /></td>
                                <td><button type="button" className="btn-text-danger" onClick={() => removeRow(rates, setRates, i)}>✕</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* 4. FUEL */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px" }}>
                    <h4 style={{ color: "var(--brand-accent)" }}>Fuel Escalation (FSC)</h4>
                    <button type="button" className="btn btn-secondary" onClick={() => addRow(setFuelMatrix, { fuel_price_from: "", fuel_price_to: "", surcharge_percentage: "" })}>+ Add Fuel Slab</button>
                </div>
                <table style={{ width: "100%", marginBottom: "20px" }}>
                    <thead><tr style={{ textAlign: "left" }}><th>Diesel Price From (₹)</th><th>Diesel Price To (₹)</th><th>FSC Applicable (%)</th><th></th></tr></thead>
                    <tbody>
                        {fuelMatrix.map((f, i) => (
                            <tr key={i}>
                                <td><input className="form-input" type="number" step="0.01" value={f.fuel_price_from} onChange={e => handleTableChange(fuelMatrix, setFuelMatrix, i, "fuel_price_from", e.target.value)} /></td>
                                <td><input className="form-input" type="number" step="0.01" value={f.fuel_price_to} onChange={e => handleTableChange(fuelMatrix, setFuelMatrix, i, "fuel_price_to", e.target.value)} /></td>
                                <td><input className="form-input" type="number" step="0.01" value={f.surcharge_percentage} onChange={e => handleTableChange(fuelMatrix, setFuelMatrix, i, "surcharge_percentage", e.target.value)} /></td>
                                <td><button type="button" className="btn-text-danger" onClick={() => removeRow(fuelMatrix, setFuelMatrix, i)}>✕</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* 5. ODA 2D MATRIX */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px", marginBottom: "15px" }}>
                    <h4 style={{ color: "var(--brand-accent)" }}>ODA Delivery Matrix</h4>
                    <div>
                        <button type="button" className="btn btn-secondary" style={{ marginRight: "10px" }} onClick={addOdaCol}>+ Add Weight Column</button>
                        <button type="button" className="btn btn-secondary" onClick={addOdaRow}>+ Add Distance Row</button>
                    </div>
                </div>

                <div style={{ overflowX: "auto", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", marginBottom: "30px" }}>
                    <table style={{ width: "100%", minWidth: "800px", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ background: "var(--bg-surface)", padding: "10px", borderBottom: "2px solid var(--border-light)", borderRight: "2px solid var(--border-light)" }}>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "right" }}>Weights (KG) &rarr;</div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "left" }}>Distances (KM) &darr;</div>
                                </th>
                                {odaWeights.map(wt => (
                                    <th key={wt.id} style={{ background: "var(--bg-surface)", padding: "10px", borderBottom: "2px solid var(--border-light)", borderRight: "1px solid var(--border-light)" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                                            <input className="form-input" style={{ width: "60px", padding: "4px", textAlign: "center" }} placeholder="Min" value={wt.from} onChange={e => updateOdaAxis(setOdaWeights, odaWeights, wt.id, 'from', e.target.value)} />
                                            <span style={{ color: "var(--text-muted)" }}>-</span>
                                            <input className="form-input" style={{ width: "60px", padding: "4px", textAlign: "center" }} placeholder="Max" value={wt.to} onChange={e => updateOdaAxis(setOdaWeights, odaWeights, wt.id, 'to', e.target.value)} />
                                            <button type="button" className="btn-text-danger" style={{ padding: "0 5px", fontSize: "16px" }} onClick={() => removeOdaCol(wt.id)}>&times;</button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {odaDistances.map(dist => (
                                <tr key={dist.id}>
                                    <td style={{ background: "var(--bg-surface)", padding: "10px", borderBottom: "1px solid var(--border-light)", borderRight: "2px solid var(--border-light)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                            <input className="form-input" style={{ width: "60px", padding: "4px", textAlign: "center" }} placeholder="Min" value={dist.from} onChange={e => updateOdaAxis(setOdaDistances, odaDistances, dist.id, 'from', e.target.value)} />
                                            <span style={{ color: "var(--text-muted)" }}>-</span>
                                            <input className="form-input" style={{ width: "60px", padding: "4px", textAlign: "center" }} placeholder="Max" value={dist.to} onChange={e => updateOdaAxis(setOdaDistances, odaDistances, dist.id, 'to', e.target.value)} />
                                            <button type="button" className="btn-text-danger" style={{ padding: "0 5px", fontSize: "16px", marginLeft: "auto" }} onClick={() => removeOdaRow(dist.id)}>&times;</button>
                                        </div>
                                    </td>
                                    {odaWeights.map(wt => {
                                        const cellKey = `${dist.id}_${wt.id}`;
                                        return (
                                            <td key={cellKey} style={{ padding: "10px", borderBottom: "1px solid var(--border-light)", borderRight: "1px solid var(--border-light)" }}>
                                                <input className="form-input" type="number" placeholder="₹ Value" style={{ width: "100%", boxSizing: "border-box", textAlign: "center" }} value={odaCharges[cellKey] ?? ""} onChange={e => updateOdaCharge(dist.id, wt.id, e.target.value)} />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* SAVE CONTROLS (Only visible if state differs from original) */}
                {hasChanges && (
                    <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-light)", paddingTop: "20px" }}>
                        <button type="submit" className="btn btn-success" style={{ padding: "12px 30px", fontSize: "16px", fontWeight: "bold" }}>
                            {selectedPartnerId ? "Update Changed Matrices" : "Save New Transporter Master"}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}