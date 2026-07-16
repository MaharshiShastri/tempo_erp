import useLogisticsHub from "../hooks/useLogisticsHub";
import { useState } from "react";
export default function LogisticsPartnerEntryView({ state }) {
    const [modalAlert, setModalAlert] = useState({ isOpen: false, title: "", message: "", isError: false });
    const logistics = state.logisticsState;
    
    const {partner, setPartner, availablePartners, selectedPartnerId, zones, fuelMatrix, odaDistances, odaWeights,
        odaCharges, addRow, removeRow, handleTableChange, addOdaRow, addOdaCol, updateOdaAxis, updateOdaCharge,
        removeOdaRow, removeOdaCol, setZones, setFuelMatrix, setOdaWeights, setOdaDistances, handlePartnerSelection, 
        handleSave, handleDelete, fileInputRef, handleFileUpload, isExtracting, isDeleting, buildCurrentPayload, originalPayloadString
    } = logistics;

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