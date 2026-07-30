import useLogisticsHub from "../hooks/logistics/useLogisticsHub";
import { useState } from "react";
export default function LogisticsPartnerReadOnlyView({ state }) {

    return (
        <div className="frappe-card" style={{ maxWidth: 1200, margin: "0 auto", padding: 25 }}>
            <div className="system-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>🚚 Logistics Configuration</h3>
                
                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                    
                    <select className="form-select-native" value={state.selectedPartnerId} onChange={state.handlePartnerSelection}>
                        <option value="">No partner selected</option>
                        {state.availablePartners.map(p => <option key={p.id} value={p.id}>✏️ {p.name}</option>)}
                    </select>
                </div>
            </div>

            {!state.selectedPartnerId && (
                <div style={{padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                    Select a transporter to view its logistics configuration.
                </div>
            )}

            {state.selectedPartnerId && (
            <form onSubmit={state.handlePartnerSave}>
                <h4 style={{ color: "var(--brand-accent)", marginTop: "20px" }}>Core Contract Parameters</h4>
                <div className="form-grid-layout" style={{ gap: "15px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
                    <div className="form-group"><label className="input-label">Transporter Name</label><input required className="form-input" value={state.partner.name} onChange={e => state.setPartner({ ...state.partner, name: e.target.value })} readOnly/></div>
                    <div className="form-group"><label className="input-label">Distance Calculator Link</label><input type="url" className="form-input" value={state.partner.partner_link || ""} onChange={e => state.setPartner({ ...state.partner, partner_link: e.target.value })} readOnly/></div>
                    <div className="form-group"><label className="input-label">Mobile Number</label><input type="text" className="form-input" value={state.partner.mobile_number || ""} onChange={e=> state.setPartner({...state.partner, mobile_number: e.target.value})} readOnly/></div>
                    <div className="form-group"><label className="input-label">CFT Factor</label><input required type="number" step="0.01" className="form-input" value={state.partner.cft_factor} onChange={e => state.setPartner({ ...state.partner, cft_factor: e.target.value })} readOnly/></div>
                    <div className="form-group"><label className="input-label">Min Weight (KG)</label><input required type="number" className="form-input" value={state.partner.minimum_weight} onChange={e => state.setPartner({ ...state.partner, minimum_weight: e.target.value })} readOnly/></div>
                    <div className="form-group"><label className="input-label">Min Freight Value (₹)</label><input required type="number" className="form-input" value={state.partner.minimum_freight_value} onChange={e => state.setPartner({ ...state.partner, minimum_freight_value: e.target.value })} readOnly/></div>
                    <div className="form-group"><label className="input-label">Docs/GC Charge</label><input required type="number" className="form-input" value={state.partner.documentation_charge} onChange={e => state.setPartner({ ...state.partner, documentation_charge: e.target.value })} readOnly/></div>
                    <div className="form-group"><label className="input-label">FOV Risk (%)</label><input required type="number" step="0.01" className="form-input" value={state.partner.fov_percentage} onChange={e => state.setPartner({ ...state.partner, fov_percentage: e.target.value })} readOnly/></div>
                    <div className="form-group"><label className="input-label" style={{ color: 'var(--brand-success)'}}>Local Loading cost (₹)</label><input required type="number" step="1" className="form-input" value={state.partner.local_loading_cost} onChange={e => state.setPartner({ ...state.partner, local_loading_cost: e.target.value })} readOnly/></div>
                    <div className="form-group"><label className="input-label" style={{ color: 'var(--brand-danger)'}}>Max Hub Loading Cap (₹)</label><input required type="number" step="1" className="form-input" value={state.partner.hub_loading_max_cost} onChange={e => state.setPartner({ ...state.partner, hub_loading_max_cost: e.target.value })} readOnly/></div>
                    <div className="form-group"><label className="input-label">GST Rate (%)</label><input required type="number" className="form-input" value={state.partner.gst_percentage} onChange={e => state.setPartner({ ...state.partner, gst_percentage: e.target.value })} readOnly/></div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px" }}>
                    <h4 style={{ color: "var(--brand-accent)" }}>Zone Definitions & Freight Rates</h4>
                </div>
                <table style={{ width: "100%", marginBottom: "20px" }}>
                    <thead><tr style={{ textAlign: "left" }}>
                        <th>Zone Code</th>
                        <th>Regions Served</th>
                        <th>States (Comma Separated)</th>
                        <th>Rate (₹/kg)</th>
                        <th></th>
                    </tr></thead>
                    <tbody>
                        {state.zones.map((z, i) => (
                            <tr key={i}>
                                <td><input className="form-input" readOnly style={{ textTransform: "uppercase" }} value={z.zone_code} onChange={e => state.handleTableChange(state.zones, state.setZones, i, "zone_code", e.target.value)} /></td>
                                <td><input className="form-input" readOnly value={z.zone_name} onChange={e => state.handleTableChange(state.zones, state.setZones, i, "zone_name", e.target.value)} /></td>
                                <td><input className="form-input" readOnly value={z.states_raw} onChange={e => state.handleTableChange(state.zones, state.setZones, i, "states_raw", e.target.value)} /></td>
                                <td><input className="form-input" readOnly type="number" step="0.01" placeholder="0.00" value={z.rate_per_kg} onChange={e => state.handleTableChange(state.zones, state.setZones, i, "rate_per_kg", e.target.value)} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px" }}>
                    <h4 style={{ color: "var(--brand-accent)" }}>Fuel Escalation (FSC)</h4>
                </div>
                <table style={{ width: "100%", marginBottom: "20px" }}>
                    <thead>
                        <tr style={{ textAlign: "left" }}>
                            <th>Diesel Price From (₹)</th>
                            <th>Diesel Price To (₹)</th>
                            <th>FSC Applicable (%)</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.fuelMatrix.map((f, i) => (
                            <tr key={i}>
                                <td><input className="form-input" type="number" step="0.01" readOnly value={f.fuel_price_from} onChange={e => state.handleTableChange(state.fuelMatrix, state.setFuelMatrix, i, "fuel_price_from", e.target.value)} /></td>
                                <td><input className="form-input" type="number" step="0.01" readOnly value={f.fuel_price_to} onChange={e => state.handleTableChange(state.fuelMatrix, state.setFuelMatrix, i, "fuel_price_to", e.target.value)} /></td>
                                <td><input className="form-input" type="number" step="0.01" readOnly value={f.surcharge_percentage} onChange={e => state.handleTableChange(state.fuelMatrix, state.setFuelMatrix, i, "surcharge_percentage", e.target.value)} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px", marginBottom: "15px" }}>
                    <h4 style={{ color: "var(--brand-accent)" }}>ODA Delivery Matrix</h4>
                </div>

                <div style={{ overflowX: "auto", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", marginBottom: "30px" }}>
                    <table style={{ width: "100%", minWidth: "800px", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ background: "var(--bg-surface)", padding: "10px", borderBottom: "2px solid var(--border-light)", borderRight: "2px solid var(--border-light)" }}>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "right" }}>Weights (KG) &rarr;</div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "left" }}>Distances (KM) &darr;</div>
                                </th>
                                {state.odaWeights.map(wt => (
                                    <th key={wt.id} style={{ background: "var(--bg-surface)", padding: "10px", borderBottom: "2px solid var(--border-light)", borderRight: "1px solid var(--border-light)" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                                            <input className="form-input" style={{ width: "60px", padding: "4px", textAlign: "center" }} readOnly placeholder="Min" value={wt.from} onChange={e => state.updateOdaAxis(state.setOdaWeights, state.odaWeights, wt.id, 'from', e.target.value)} />
                                            <span style={{ color: "var(--text-muted)" }}>-</span>
                                            <input className="form-input" style={{ width: "60px", padding: "4px", textAlign: "center" }} readOnly placeholder="Max" value={wt.to} onChange={e => state.updateOdaAxis(state.setOdaWeights, state.odaWeights, wt.id, 'to', e.target.value)} />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {state.odaDistances.map(dist => (
                                <tr key={dist.id}>
                                    <td style={{ background: "var(--bg-surface)", padding: "10px", borderBottom: "1px solid var(--border-light)", borderRight: "2px solid var(--border-light)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                            <input className="form-input" style={{ width: "60px", padding: "4px", textAlign: "center" }} placeholder="Min" value={dist.from} onChange={e => state.updateOdaAxis(state.setOdaDistances, state.odaDistances, dist.id, 'from', e.target.value)} readOnly />
                                            <span style={{ color: "var(--text-muted)" }}>-</span>
                                            <input className="form-input" style={{ width: "60px", padding: "4px", textAlign: "center" }} placeholder="Max" value={dist.to} onChange={e => state.updateOdaAxis(state.setOdaDistances, state.odaDistances, dist.id, 'to', e.target.value)} readOnly />
                                        </div>
                                    </td>
                                    {state.odaWeights.map(wt => {
                                        const cellKey = `${dist.id}_${wt.id}`;
                                        return (
                                            <td key={cellKey} style={{ padding: "10px", borderBottom: "1px solid var(--border-light)", borderRight: "1px solid var(--border-light)" }}>
                                                <input className="form-input" type="number" placeholder="₹" style={{ width: "100%", boxSizing: "border-box", textAlign: "center" }} value={state.odaCharges[cellKey] ?? ""} onChange={e => state.updateOdaCharge(dist.id, wt.id, e.target.value)} readOnly/>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </form>)}
        </div>
    );
}