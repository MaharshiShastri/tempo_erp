import { FiExternalLink, FiTruck } from "react-icons/fi";
import IndianCurrencyInput from "../components/shared/IndianCurrencyInput";

export default function DispatchCalculatorView({ state }) {
       
    return (
        <div className="frappe-card">  
            <div className="system-header">
                <div>
                    <h2>Freight Logistics Evaluator</h2>
                     <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Contract Rate Comparison</p>
                </div>
            </div>
            <form onSubmit={state.handleEvaluate} style={{ background: "var(--bg-main)", padding: "20px", borderRadius: "var(--radius-sm)", marginBottom: "20px", border: "1px solid var(--border-light)" }}>
                
                {/* ROW 1: Multi-Product Cart */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ margin: 0 }}>Shipment Contents</h4>
                    
                    {/* Unit Toggle Switch */}
                    <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                        <button type="button" onClick={() => state.setUnit('cm')} style={{ padding: '4px 12px', border: 'none', background: state.unit === 'cm' ? 'var(--brand-accent)' : 'transparent', color: state.unit === 'cm' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: state.unit === 'cm' ? '600' : 'normal', transition: 'all 0.2s' }}>
                            Centimeters (cm)
                        </button>
                        <button type="button" onClick={() => state.setUnit('in')} style={{ padding: '4px 12px', border: 'none', background: state.unit === 'in' ? 'var(--brand-accent)' : 'transparent', color: state.unit === 'in' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: state.unit === 'in' ? '600' : 'normal', transition: 'all 0.2s' }}>
                            Inches (in)
                        </button>
                    </div>
                </div>

                {state.products.map((p, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '10px', position: 'relative' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>PRODUCT PACKAGING {idx + 1}</div>
                            {idx > 0 && (
                                <button type="button" onClick={() => state.removeProduct(idx)} className="btn-text-danger" style={{ fontSize: '14px', padding: 0 }}>✕ Remove</button>
                            )}
                        </div>

                        <div className="form-grid-layout" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                            <div>
                                <label className="input-label">Width ({state.unit})</label>
                                <input type="number" step="0.01" min="0" required className="form-input" value={p.width} onChange={(e) => state.updateProduct(idx, 'width', e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">Depth ({state.unit})</label>
                                <input type="number" step="0.01" min="0" required className="form-input" value={p.depth} onChange={(e) => state.updateProduct(idx, 'depth', e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">Height ({state.unit})</label>
                                <input type="number" step="0.01" min="0" required className="form-input" value={p.height} onChange={(e) => state.updateProduct(idx, 'height', e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}

                {state.products.length < 5 && (
                    <button type="button" onClick={state.addProduct} style={{ width: '100%', padding: '10px', border: '1px dashed var(--brand-accent)', background: 'transparent', color: 'var(--brand-accent)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginBottom: '25px', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f0f7ff'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        + Add Another Package ({state.products.length}/5)
                    </button>
                )}

                {/* ROW 2: FIXED GRID ALIGNMENT */}
                <div className="form-grid-layout" style={{gridTemplateColumns: "repeat(3, 1fr)", marginBottom: '25px'}}>
                    <div>
                        <label className="input-label">Total Invoice Value (₹)</label>
                        <IndianCurrencyInput className="form-input" value={state.dim.invoice_value === 0 ? '' : state.dim.invoice_value} onChange={(raw) => state.setDim({ ...state.dim, invoice_value: raw })} />
                    </div>
                    <div>
                        <label className="input-label">Destination City <strong style={{color: "var(--brand-danger)"}}>(CITY ONLY!)</strong></label>
                        <input type="text" required className="form-input" value={state.dim.destination_city} onChange={(e) => state.setDim({ ...state.dim, destination_city: e.target.value })} />
                    </div>
                    <div>
                        <label className="input-label">Weight of the material(KG)</label>
                        <input type="number" min="0" step="0.01" required className="form-input" value={state.dim.weight} onChange={(e) => state.setDim({ ...state.dim, weight: +e.target.value })} />
                    </div>
                </div>

                {/* ROW 3 */}
                <h4 style={{margin: "0 0 10px 0"}}>Operations & Loading (Ask from Mr.Sachin)</h4>
                <div className="form-grid-layout" style={{gridTemplateColumns:"repeat(3, 1fr)", marginBottom: '20px', alignItems:"start"}}>
                    
                    {/* CUSTOM TOGGLE SWITCH: Loading Method */}
                    <div style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <label className="input-label" style={{ marginBottom: '10px', display: 'block' }}>Loading Method Setup</label>
                        
                        <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden', width: 'fit-content' }}>
                            <button type="button" onClick={() => state.setDim({...state.dim, loading_type: 'local'})} style={{ padding: '6px 14px', border: 'none', background: state.dim.loading_type === 'local' ? 'var(--brand-accent)' : 'transparent', color: state.dim.loading_type === 'local' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: state.dim.loading_type === 'local' ? '600' : 'normal', transition: 'all 0.2s' }}>
                                📍 Local (Fixed)
                            </button>
                            <button type="button" onClick={() => state.setDim({...state.dim, loading_type: 'hub'})} style={{ padding: '6px 14px', border: 'none', background: state.dim.loading_type === 'hub' ? 'var(--brand-accent)' : 'transparent', color: state.dim.loading_type === 'hub' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: state.dim.loading_type === 'hub' ? '600' : 'normal', transition: 'all 0.2s' }}>
                                🏢 Hub (Variable)
                            </button>
                        </div>

                        {state.dim.loading_type === 'hub' && (
                            <div style={{ marginTop: '15px' }}>
                                <label className="input-label" style={{ fontSize: '11px', color: 'var(--brand-danger)' }}>Enter Hub Amount (₹)</label>
                                <input className="form-input" type="number" required value={state.dim.hub_loading_input} onChange={e => state.setDim({...state.dim, hub_loading_input: +e.target.value})} />
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>*Will be capped by partner max threshold if defined</span>
                            </div>
                        )}
                    </div>

                    {/* CUSTOM TOGGLE SWITCH: Delivery Type */}
                    <div style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <label className="input-label" style={{ marginBottom: '10px', display: 'block' }}>Final Delivery Type</label>
                        
                        <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden', width: 'fit-content' }}>
                            <button type="button" onClick={() => state.setDim({...state.dim, delivery_type: 'door'})} style={{ padding: '6px 14px', border: 'none', background: state.dim.delivery_type === 'door' ? 'var(--brand-accent)' : 'transparent', color: state.dim.delivery_type === 'door' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: state.dim.delivery_type === 'door' ? '600' : 'normal', transition: 'all 0.2s' }}>
                                🚪 Door
                            </button>
                            <button type="button" onClick={() => state.setDim({...state.dim, delivery_type: 'godown'})} style={{ padding: '6px 14px', border: 'none', background: state.dim.delivery_type === 'godown' ? 'var(--brand-accent)' : 'transparent', color: state.dim.delivery_type === 'godown' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: state.dim.delivery_type === 'godown' ? '600' : 'normal', transition: 'all 0.2s' }}>
                                🏭 Godown Hub
                            </button>
                        </div>
                        
                        <div style={{ fontSize: '11px', color: state.dim.delivery_type === 'door' ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '15px' }}>
                            {state.dim.delivery_type === 'door' ? "Requires manual distance mapping below." : "Distance mapping disabled. No ODA charges will apply."}
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', border: '1px dashed var(--brand-accent)' }}>
                        <label className="input-label" style={{ color: 'var(--brand-accent)' }}>Extra Hamali Adjustments</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                             <div><label className="input-label" style={{ fontSize: "11px" }}>Detail</label><input className="form-input" placeholder="e.g., Unloading" value={state.dim.hamali_detail} onChange={(e) => state.setDim({ ...state.dim, hamali_detail: e.target.value })} /></div>
                            <div><label className="input-label" style={{ fontSize: "11px" }}>Cost (₹)</label><input className="form-input" type="number" value={state.dim.hamali_cost} onChange={(e) => state.setDim({ ...state.dim, hamali_cost: +e.target.value })} /></div>
                        </div>
                    </div>
                </div>

                {state.dim.delivery_type === 'door' && (
                    <>
                        <h4 style={{ marginTop: 25, borderTop: "1px solid var(--border-light)", paddingTop: "15px" }}>Transporter Distance Mapping (Door Delivery)</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: "15px", marginTop: "10px" }}>
                            {state.partners.filter(partner => partner.partner_link).map((partner) => ( 
                                <div key={partner.id} style={{ border: "1px solid var(--border-light)", borderRadius: "8px", padding: "15px", background: "var(--bg-surface)" }}>
                                    <h4 style={{ margin: 0 }}>{partner.name}</h4>
                                    <p style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-muted)"}}>
                                        {partner.partner_link && (<a href={partner.partner_link} style={{color: 'var(--text-primary)'}} target="_blank" rel="noopener noreferrer" title="Open Partner Website">Find distance calculator here <FiExternalLink size={14} /></a>)}
                                    </p>
                                    <label className="input-label">Distance from Hub (KM)</label>
                                    <input type="number" min={1} className="form-input" value={state.partnerDistances[partner.id] || 0} onChange={(e) => state.setPartnerDistances({ ...state.partnerDistances, [partner.id]: Number(e.target.value) }) } />
                                </div>
                            ))}
                        </div>
                    </>
                )}
                <button className="btn btn-primary" type="submit" style={{ marginTop: 20 }}>Evaluate Dispatch Options</button>
            </form>
            

            {state.resultsData?.options?.length > 0 && (
                <div>
                     <h4>Total Options: {state.resultsData.options.length}</h4>
                    <div style={{ display: "flex", gap: 15, overflowX: "auto" }}>
                        {state.resultsData.options.map((opt, idx) => {
                            const isBest = state.selectedTransport?.partner_name === opt.partner_name;
                            return (
                                 <div key={idx} style={{ minWidth: 280, padding: 15, border: isBest ? "2px solid var(--brand-success)" : "1px solid var(--border-subtle)", background: isBest ? "#eaffea" : "var(--bg-surface)" }}>
                                    <strong style={{ color: "var(--brand-accent)" }}>Partners Evaluation:</strong>
                                         <h4>{opt.partner_name}{isBest && <span style={{marginLeft: 8, padding: "2px 8px", fontSize: "11px", fontWeight: 600, borderRadius: "12px", background: "var(--brand-success)", color: "#fff", display: "inline-block", verticalAlign: "middle" }}>🟢 Cheapest</span>}</h4>
                                    <p>Cost: ₹{opt.dispatch_cost_gst}</p>
                                    <details style={{ marginTop: 10 }}>
                                         <summary>Cost Breakdown</summary>
                                        <div style={{ marginTop: 10, fontSize: "13px", display: "grid", gridTemplateColumns: "1fr auto", gap: "6px" }}>
                                            <span>Destination Zone</span><strong>{opt.destination_zone}</strong>
                                            <span>State</span><strong>{opt.state}</strong>
                                            <span>Chargeable Weight</span><strong>{opt.chargeable_weight} kg</strong>
                                            <span>Basic Freight</span><strong>₹{opt.basic_freight}</strong>
                                            <span>Loading Charge</span><strong>₹{opt.loading_charge}</strong>
                                            <span>Fuel Charge</span><strong>₹{opt.fuel_charge}</strong>
                                            <span>Documentation Charge</span><strong>₹{opt.documentation_charge}</strong>
                                            <span>FOV Charge</span><strong>₹{opt.fov_charge}</strong>
                                            <span>ODA Charge</span><strong>₹{opt.oda_charge}</strong>
                                            {opt.hamali_cost > 0 && (<><span style={{color: "var(--brand-accent)"}}>{opt.hamali_detail || "Hamali Charges"}</span><strong style={{color: "var(--brand-accent)"}}>₹{opt.hamali_cost}</strong></>)}
                                            <span>Charges before Taxes</span><strong>₹{opt.subtotal}</strong>
                                            <span>Total Cost after Taxes</span><strong>₹{opt.dispatch_cost_gst}</strong>
                                        </div>
                                    </details>
                                      <button className="btn btn-success" onClick={() => state.confirmTransport(opt)} style={{ marginTop: '10px', width: '100%' }}>Select</button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {state.selectedTransport && (
                <div className="modal-overlay">
                    <div className="modal-box">
                          <h3>Confirmed Transport</h3>
                        <p>{state.selectedTransport.partner_name}</p>
                        <p>Final Cost: ₹{state.selectedTransport.dispatch_cost_gst}</p>
                        <button className="btn btn-primary" onClick={() => state.confirmTransport(state.selectedTransport)}>Print Invoice</button>
                        {" or "}
                        <button className="btn btn-secondary" onClick={() => state.setSelectedTransport(null)}>Close</button>
                    </div>
                </div>
            )}
            
            {state.modalAlert.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ borderTop: `4px solid ${state.modalAlert.isError ? "var(--brand-danger)" : "var(--brand-success)"}` }}>
                        <h3 style={{ color: state.modalAlert.isError ? "var(--brand-danger)" : "var(--brand-success)" }}>
                            {state.modalAlert.title}
                        </h3>
                        <p style={{ margin: "15px 0" }}>{state.modalAlert.message}</p>
                        <button className="btn btn-secondary" onClick={() => state.setModalAlert({ isOpen: false, title: "", message: "", isError: false })}>Acknowledge</button>
                    </div>
                </div>
            )}
        </div>
    );
}