import { useState, useEffect, useRef } from "react";
import API from "../api/api";

export default function LogisticsPartnerEntryView({ state }) {
    const [availablePartners, setAvailablePartners] = useState([]);
    const [selectedPartnerId, setSelectedPartnerId] = useState("");
    const [originalPayloadString, setOriginalPayloadString] = useState("{}");
    const [modalAlert, setModalAlert] = useState({ isOpen: false, title: "", message: "", isError: false });
    const [isExtracting, setIsExtracting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef(null);

    const defaultPartner = {
        name: "", partner_link: "", cft_factor: 10.0, minimum_weight: 0.0, minimum_freight_value: 0.0,
        documentation_charge: 0.0, fov_percentage: 0.0, gst_percentage: 18.0, local_loading_cost: 0.0, hub_loading_max_cost: 0.0
    };

    const [partner, setPartner] = useState(defaultPartner);
    
    const [zones, setZones] = useState([]);
    const [fuelMatrix, setFuelMatrix] = useState([]);
    const [odaDistances, setOdaDistances] = useState([]); 
    const [odaWeights, setOdaWeights] = useState([]);     
    const [odaCharges, setOdaCharges] = useState({});     

    useEffect(() => { loadPartnersList(); }, []);

    const loadPartnersList = async () => {
        try {
            const data = await API.getPartners(state.user.access_token);
            setAvailablePartners(data || []);
        } catch (err) {
            setModalAlert({ isOpen: true, title: "Fetch Error", message: "Failed to load partners list.", isError: true });
        }
    };

    const buildCurrentPayload = () => {
        const compiledOdaMatrix = [];
        odaDistances.forEach(dist => {
            odaWeights.forEach(wt => {
                const chargeVal = odaCharges[`${dist.id}_${wt.id}`];
                if (chargeVal !== undefined && chargeVal !== "" && chargeVal !== null) {
                    compiledOdaMatrix.push({
                        km_from: parseFloat(dist.from) || 0, km_to: parseFloat(dist.to) || 0,
                        weight_from: parseFloat(wt.from) || 0, weight_to: parseFloat(wt.to) || 0,
                        oda_charge: parseFloat(chargeVal) || 0
                    });
                }
            });
        });

        return {
            name: partner.name || "", partner_link: partner.partner_link || "", cft_factor: parseFloat(partner.cft_factor) || 0,
            minimum_weight: parseFloat(partner.minimum_weight) || 0, minimum_freight_value: parseFloat(partner.minimum_freight_value) || 0,
            documentation_charge: parseFloat(partner.documentation_charge) || 0, fov_percentage: parseFloat(partner.fov_percentage) || 0,
            gst_percentage: parseFloat(partner.gst_percentage) || 0, local_loading_cost: parseFloat(partner.local_loading_cost) || 0, 
            hub_loading_max_cost: parseFloat(partner.hub_loading_max_cost) || 0,
            
            // Build the Zones list for the backend
            zones: zones.filter(z => z.zone_code).map(z => ({ 
                zone_code: z.zone_code.trim(), 
                zone_name: (z.zone_name || "").trim(), 
                states: (z.states_raw || "").split(",").map(s => s.trim()).filter(Boolean) 
            })),
            
            // Automatically derive the Rates list from the unified UI table for the backend
            rates: zones.filter(z => z.zone_code && z.rate_per_kg !== "").map(z => ({ 
                destination_zone: z.zone_code.trim(), 
                rate_per_kg: parseFloat(z.rate_per_kg) || 0 
            })),
            
            fuel_matrix: fuelMatrix.filter(f => f.fuel_price_from !== "" && f.fuel_price_to !== "").map(f => ({ fuel_price_from: parseFloat(f.fuel_price_from) || 0, fuel_price_to: parseFloat(f.fuel_price_to) || 0, surcharge_percentage: parseFloat(f.surcharge_percentage) || 0 })),
            oda_matrix: compiledOdaMatrix
        };
    };

    const populateState = (profile) => {
        setPartner({
            name: profile.name || "", partner_link: profile.partner_link || "", cft_factor: profile.cft_factor ?? 10,
            minimum_weight: profile.minimum_weight ?? 0, minimum_freight_value: profile.minimum_freight_value ?? 0,
            documentation_charge: profile.documentation_charge ?? 0, fov_percentage: profile.fov_percentage ?? 0,
            gst_percentage: profile.gst_percentage ?? 18, local_loading_cost: profile.local_loading_cost ?? 0, hub_loading_max_cost: profile.hub_loading_max_cost ?? 0
        });

        // Smart merge: Map the backend's separate rates back onto their matching zones for the UI
        const loadedZones = profile.zones || [];
        const loadedRates = profile.rates || [];
        
        const unifiedZones = loadedZones.map(z => {
            const matchingRate = loadedRates.find(r => r.destination_zone === z.zone_code);
            return {
                ...z,
                states_raw: z.states_raw || (z.states ? z.states.join(', ') : ""),
                rate_per_kg: matchingRate ? matchingRate.rate_per_kg : ""
            };
        });

        setZones(unifiedZones);
        setFuelMatrix(profile.fuel_matrix || []);

        const loadedOda = profile.oda_matrix || [];
        const dMap = new Map(); const wMap = new Map(); const newCharges = {};

        loadedOda.forEach((o, idx) => {
            const dKey = `${o.km_from}-${o.km_to}`; const wKey = `${o.weight_from}-${o.weight_to}`;
            if (!dMap.has(dKey)) dMap.set(dKey, { id: `d_${idx}`, from: o.km_from, to: o.km_to });
            if (!wMap.has(wKey)) wMap.set(wKey, { id: `w_${idx}`, from: o.weight_from, to: o.weight_to });
            newCharges[`${dMap.get(dKey).id}_${wMap.get(wKey).id}`] = o.oda_charge;
        });

        setOdaDistances(Array.from(dMap.values())); setOdaWeights(Array.from(wMap.values())); setOdaCharges(newCharges);

        setTimeout(() => setOriginalPayloadString(JSON.stringify(buildCurrentPayload())), 100);
    };

    const handleDelete = async () => {
        if (!selectedPartnerId) return;
        
        const confirmDelete = window.confirm(
            "⚠️ Are you sure you want to completely delete this logistics partner?\n\nThis will permanently wipe all their core parameters, zones, rates, fuel matrices, and ODA matrices. This action cannot be undone."
        );
        
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/v1/logistics/config/partners/${selectedPartnerId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${state.user.access_token}` }
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Deletion failed on the server.");
            }

            const result = await response.json();
            
            setModalAlert({ 
                isOpen: true, 
                title: "Partner Deleted", 
                message: `🗑️ ${result.partner_name || "Logistics Partner"} was successfully removed from the system.`, 
                isError: false 
            });
            
            setSelectedPartnerId("");
            populateState(defaultPartner);
            loadPartnersList(); 
            
        } catch (err) {
            setModalAlert({ isOpen: true, title: "Deletion Failed", message: err.message, isError: true });
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePartnerSelection = async (e) => {
        const id = e.target.value;
        setSelectedPartnerId(id);
        if (!id) { populateState(defaultPartner); return; }

        try {
            const profile = await API.getPartnerProfile(id, state.user.access_token);
            populateState(profile);
        } catch (err) {
            setModalAlert({ isOpen: true, title: "Fetch Error", message: "Failed to load partner profile.", isError: true });
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setIsExtracting(true);
        setModalAlert({ isOpen: true, title: "🤖 AI Document Analysis", message: "Extracting contract parameters... This will take a moment.", isError: false });

        try {
            const response = await fetch("/api/v1/dispatch/partners/extract-from-file", {
                method: "POST",
                headers: { "Authorization": `Bearer ${state.user.access_token}` },
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Extraction failed");
            }

            const result = await response.json();
            
            setSelectedPartnerId(""); 
            populateState(result.data);
            
            setModalAlert({ isOpen: true, title: "Extraction Complete", message: "Please review the auto-filled data below before saving to the database.", isError: false });
        } catch (err) {
            setModalAlert({ isOpen: true, title: "AI Extraction Failed", message: err.message, isError: true });
        } finally {
            setIsExtracting(false);
            if(fileInputRef.current) fileInputRef.current.value = ""; 
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = buildCurrentPayload();
        try {
            let backendResponse;
            if (selectedPartnerId) { backendResponse = await API.updateDispatchPartner(selectedPartnerId, payload, state.user.access_token); } 
            else { backendResponse = await API.saveDispatchPartner(payload, state.user.access_token); setSelectedPartnerId(""); }
            
            const actionStatus = backendResponse.status || "processed";
            const partnerName = backendResponse.partner_name || payload.name;
            setModalAlert({ isOpen: true, title: "Database Synced", message: `🚚 Logistics Partner "${partnerName}" was successfully ${actionStatus}.`, isError: false });
            setOriginalPayloadString(JSON.stringify(payload));
            loadPartnersList(); 
        } catch (err) {
            setModalAlert({ isOpen: true, title: "Sync Failure", message: err.message, isError: true });
        }
    };

    const addRow = (setter, defaultObj) => setter(prev => [...prev, defaultObj]);
    const removeRow = (list, setter, idx) => setter(list.filter((_, i) => i !== idx));
    const handleTableChange = (list, setter, idx, field, val) => { const updated = [...list]; updated[idx][field] = val; setter(updated); };
    const addOdaRow = () => setOdaDistances([...odaDistances, { id: `d_${Date.now()}`, from: "", to: "" }]);
    const addOdaCol = () => setOdaWeights([...odaWeights, { id: `w_${Date.now()}`, from: "", to: "" }]);
    const updateOdaAxis = (setter, list, id, field, val) => setter(list.map(item => item.id === id ? { ...item, [field]: val } : item));
    const updateOdaCharge = (dId, wId, val) => setOdaCharges(prev => ({ ...prev, [`${dId}_${wId}`]: val }));
    const removeOdaRow = (id) => setOdaDistances(prev => prev.filter(r => r.id !== id));
    const removeOdaCol = (id) => setOdaWeights(prev => prev.filter(c => c.id !== id));

    const hasChanges = JSON.stringify(buildCurrentPayload()) !== originalPayloadString;

    return (
        <div className="frappe-card" style={{ maxWidth: 1200, margin: "0 auto", padding: 25 }}>
            <div className="system-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>🚚 Master Logistics Onboarding</h3>
                
                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                    <div>
                        <input type="file" accept=".pdf" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                        <button type="button" className="btn btn-secondary" style={{ background: "var(--brand-accent)", color: "#fff", border: "none" }} onClick={() => fileInputRef.current.click()} disabled={isExtracting}>
                            {isExtracting ? "⏳ Extracting..." : "🤖 Auto-Fill via Contract PDF"}
                        </button>
                    </div>

                    <select className="form-select-native" value={selectedPartnerId} onChange={handlePartnerSelection}>
                        <option value="">➕ Create Manually</option>
                        {availablePartners.map(p => <option key={p.id} value={p.id}>✏️ {p.name}</option>)}
                    </select>
                </div>
            </div>

            <form onSubmit={handleSave}>
                <h4 style={{ color: "var(--brand-accent)", marginTop: "20px" }}>Core Contract Parameters</h4>
                <div className="form-grid-layout" style={{ gap: "15px" }}>
                    <div className="form-group"><label className="input-label">Transporter Name</label><input required className="form-input" value={partner.name} onChange={e => setPartner({ ...partner, name: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">Distance Calculator Link</label><input type="url" className="form-input" value={partner.partner_link || ""} onChange={e => setPartner({ ...partner, partner_link: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">CFT Factor</label><input required type="number" step="0.01" className="form-input" value={partner.cft_factor} onChange={e => setPartner({ ...partner, cft_factor: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">Min Weight (KG)</label><input required type="number" className="form-input" value={partner.minimum_weight} onChange={e => setPartner({ ...partner, minimum_weight: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">Min Freight Value (₹)</label><input required type="number" className="form-input" value={partner.minimum_freight_value} onChange={e => setPartner({ ...partner, minimum_freight_value: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">Docs/GC Charge</label><input required type="number" className="form-input" value={partner.documentation_charge} onChange={e => setPartner({ ...partner, documentation_charge: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">FOV Risk (%)</label><input required type="number" step="0.01" className="form-input" value={partner.fov_percentage} onChange={e => setPartner({ ...partner, fov_percentage: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label" style={{ color: 'var(--brand-success)'}}>Local Loading cost (₹)</label><input required type="number" step="1" className="form-input" value={partner.local_loading_cost} onChange={e => setPartner({ ...partner, local_loading_cost: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label" style={{ color: 'var(--brand-danger)'}}>Max Hub Loading Cap (₹)</label><input required type="number" step="1" className="form-input" value={partner.hub_loading_max_cost} onChange={e => setPartner({ ...partner, hub_loading_max_cost: e.target.value })} /></div>
                    <div className="form-group"><label className="input-label">GST Rate (%)</label><input required type="number" className="form-input" value={partner.gst_percentage} onChange={e => setPartner({ ...partner, gst_percentage: e.target.value })} /></div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px" }}>
                    <h4 style={{ color: "var(--brand-accent)" }}>Zone Definitions & Freight Rates</h4>
                    <button type="button" className="btn btn-secondary" onClick={() => addRow(setZones, { zone_code: "", zone_name: "", states_raw: "", rate_per_kg: "" })}>+ Add Zone Rate</button>
                </div>
                <table style={{ width: "100%", marginBottom: "20px" }}>
                    <thead><tr style={{ textAlign: "left" }}><th>Zone Code</th><th>Regions Served</th><th>States (Comma Separated)</th><th>Rate (₹/kg)</th><th></th></tr></thead>
                    <tbody>
                        {zones.map((z, i) => (
                            <tr key={i}>
                                <td><input className="form-input" style={{ textTransform: "uppercase" }} value={z.zone_code} onChange={e => handleTableChange(zones, setZones, i, "zone_code", e.target.value)} /></td>
                                <td><input className="form-input" value={z.zone_name} onChange={e => handleTableChange(zones, setZones, i, "zone_name", e.target.value)} /></td>
                                <td><input className="form-input" value={z.states_raw} onChange={e => handleTableChange(zones, setZones, i, "states_raw", e.target.value)} /></td>
                                <td><input className="form-input" type="number" step="0.01" placeholder="0.00" value={z.rate_per_kg} onChange={e => handleTableChange(zones, setZones, i, "rate_per_kg", e.target.value)} /></td>
                                <td><button type="button" className="btn-text-danger" onClick={() => removeRow(zones, setZones, i)}>✕</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

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
                                                <input className="form-input" type="number" placeholder="₹" style={{ width: "100%", boxSizing: "border-box", textAlign: "center" }} value={odaCharges[cellKey] ?? ""} onChange={e => updateOdaCharge(dist.id, wt.id, e.target.value)} />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-light)", paddingTop: "20px", marginTop: "20px" }}>
                    <div>
                        {selectedPartnerId && (
                            <button 
                                type="button" 
                                className="btn" 
                                style={{ padding: "12px 30px", fontSize: "16px", fontWeight: "bold", background: "var(--brand-danger, #dc3545)", color: "#fff", border: "none" }} 
                                onClick={handleDelete} 
                                disabled={isDeleting}
                            >
                                {isDeleting ? "⏳ Deleting..." : "🗑️ Delete Transporter"}
                            </button>
                        )}
                    </div>
                    
                    <div>
                        {hasChanges && (
                            <button type="submit" className="btn btn-success" style={{ padding: "12px 30px", fontSize: "16px", fontWeight: "bold" }}>
                                {selectedPartnerId ? "Update Changed Matrices" : "Save New Transporter Master"}
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {modalAlert.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ borderTop: `4px solid ${modalAlert.isError ? "var(--brand-danger)" : "var(--brand-success)"}` }}>
                        <h3 style={{ color: modalAlert.isError ? "var(--brand-danger)" : "var(--brand-success)" }}>
                            {modalAlert.title}
                        </h3>
                        <p style={{ margin: "15px 0" }}>{modalAlert.message}</p>
                        <button className="btn btn-secondary" onClick={() => setModalAlert({ isOpen: false, title: "", message: "", isError: false })}>
                            {isExtracting ? "Dismiss" : "Acknowledge"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}