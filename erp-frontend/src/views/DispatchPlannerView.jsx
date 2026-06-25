import { useState, useEffect } from "react";
import API from "../api/api";
import { FiExternalLink } from "react-icons/fi";

export default function DispatchPlannerView({ state }) {
    // Extracted dimensions out of 'dim' into a multi-product array
    const [products, setProducts] = useState([{ width: "", height: "", depth: ""}]);
    const [unit, setUnit] = useState("cm"); // Default unit as requested

    const [dim, setDim] = useState({ 
        invoice_value: 0, 
        destination_city: "", diesel_price: 98, 
        loading_type: "local", hub_loading_input: 0, delivery_type: "door", 
        hamali_detail: "", hamali_cost: 0
    });

    const [resultsData, setResultsData] = useState(null);
    const [selectedTransport, setSelectedTransport] = useState(null);
    const [partnerDistances, setPartnerDistances] = useState({});
    const [partners, setPartners] = useState([]);
    const [modalAlert, setModalAlert] = useState({ isOpen: false, title: "", message: "", isError: false });

    useEffect(() => {
        const loadPartners = async () => {
            try {
                const data = await API.getPartners(state.user.access_token);
                setPartners(data);
                const initialDistances = {};
                data.forEach((p) => { initialDistances[p.id] = 1; });
                setPartnerDistances(initialDistances);
            } catch (err) { console.error(err); }
        };
        loadPartners();
    }, []);

    useEffect(() => {
        if (!resultsData?.options?.length) return;
        const best = [...resultsData.options].sort((a, b) => a.dispatch_cost_gst - b.dispatch_cost_gst)[0];
        setSelectedTransport(best);
    }, [resultsData]);

    const updateProduct = (index, field, value) => {
        const updated = [...products];
        updated[index][field] = value;
        setProducts(updated);
    };

    const addProduct = () => {
        if (products.length < 5) {
            setProducts([...products, { width: "", height: "", depth: ""}]);
        }
    };

    const removeProduct = (index) => {
        if (products.length > 1) {
            setProducts(products.filter((_, i) => i !== index));
        }
    };

    const handleEvaluate = async (e) => {
        e.preventDefault();
        
        // 1. Math Magic: Aggregate volumes & weights securely
        let total_cubic_inches = 0;

        products.forEach(p => {
            let w = Number(p.width) || 0;
            let h = Number(p.height) || 0;
            let d = Number(p.depth) || 0;

            // Convert to inches ONLY if the user selected Centimeters
            if (unit === 'cm') {
                w /= 2.54;
                h /= 2.54;
                d /= 2.54;
            }

            total_cubic_inches += (w * h * d);
        });

        try {
            const finalDistances = dim.delivery_type === "godown" ? {} : partnerDistances;
            
            // 2. Transmit the payload using the 1x1xTotal trick to bypass backend rewrites!
            const payload = {
                ...dim,
                width: total_cubic_inches, // Aggregate Volume
                height: 1,                 // Constant
                depth: 1,                  // Constant
                partner_distances: finalDistances
            };

            const response = await API.evaluateDispatch(payload, state.user.access_token);
            setResultsData(response); 
        } catch (err) {
            setModalAlert({ isOpen: true, title: "Evaluation Failed", message: err.message, isError: true });
        }
    };

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
                
                {/* ROW 1: Multi-Product Cart */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ margin: 0 }}>Shipment Contents</h4>
                    
                    {/* Unit Toggle Switch */}
                    <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                        <button type="button" onClick={() => setUnit('cm')} style={{ padding: '4px 12px', border: 'none', background: unit === 'cm' ? 'var(--brand-accent)' : 'transparent', color: unit === 'cm' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: unit === 'cm' ? '600' : 'normal', transition: 'all 0.2s' }}>
                            Centimeters (cm)
                        </button>
                        <button type="button" onClick={() => setUnit('in')} style={{ padding: '4px 12px', border: 'none', background: unit === 'in' ? 'var(--brand-accent)' : 'transparent', color: unit === 'in' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: unit === 'in' ? '600' : 'normal', transition: 'all 0.2s' }}>
                            Inches (in)
                        </button>
                    </div>
                </div>

                {products.map((p, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '10px', position: 'relative' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>PRODUCT PACKAGING {idx + 1}</div>
                            {idx > 0 && (
                                <button type="button" onClick={() => removeProduct(idx)} className="btn-text-danger" style={{ fontSize: '14px', padding: 0 }}>✕ Remove</button>
                            )}
                        </div>

                        <div className="form-grid-layout" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                            <div>
                                <label className="input-label">Width ({unit})</label>
                                <input type="number" step="0.01" min="0" required className="form-input" value={p.width} onChange={(e) => updateProduct(idx, 'width', e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">Depth ({unit})</label>
                                <input type="number" step="0.01" min="0" required className="form-input" value={p.depth} onChange={(e) => updateProduct(idx, 'depth', e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">Height ({unit})</label>
                                <input type="number" step="0.01" min="0" required className="form-input" value={p.height} onChange={(e) => updateProduct(idx, 'height', e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}

                {products.length < 5 && (
                    <button type="button" onClick={addProduct} style={{ width: '100%', padding: '10px', border: '1px dashed var(--brand-accent)', background: 'transparent', color: 'var(--brand-accent)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginBottom: '25px', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f0f7ff'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        + Add Another Package ({products.length}/5)
                    </button>
                )}

                {/* ROW 2: FIXED GRID ALIGNMENT */}
                <div className="form-grid-layout" style={{gridTemplateColumns: "repeat(3, 1fr)", marginBottom: '25px'}}>
                    <div>
                        <label className="input-label">Total Invoice Value (₹)</label>
                        <input type="number" min="0" required className="form-input" value={dim.invoice_value} onChange={(e) => setDim({ ...dim, invoice_value: +e.target.value })} />
                    </div>
                    <div>
                        <label className="input-label">Destination City <strong>(CITY ONLY!)</strong></label>
                        <input type="text" required className="form-input" value={dim.destination_city} onChange={(e) => setDim({ ...dim, destination_city: e.target.value })} />
                    </div>
                    <div>
                        <label className="input-label">Current Diesel Price (₹)</label>
                        <input type="number" min="0" step="0.01" required className="form-input" value={dim.diesel_price} onChange={(e) => setDim({ ...dim, diesel_price: +e.target.value })} />
                    </div>
                </div>

                {/* ROW 3 */}
                <h4 style={{margin: "0 0 10px 0"}}>Operations & Loading (Ask from Mr.Sachin)</h4>
                <div className="form-grid-layout" style={{gridTemplateColumns:"repeat(3, 1fr)", marginBottom: '20px', alignItems:"start"}}>
                    
                    {/* CUSTOM TOGGLE SWITCH: Loading Method */}
                    <div style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <label className="input-label" style={{ marginBottom: '10px', display: 'block' }}>Loading Method Setup</label>
                        
                        <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden', width: 'fit-content' }}>
                            <button type="button" onClick={() => setDim({...dim, loading_type: 'local'})} style={{ padding: '6px 14px', border: 'none', background: dim.loading_type === 'local' ? 'var(--brand-accent)' : 'transparent', color: dim.loading_type === 'local' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: dim.loading_type === 'local' ? '600' : 'normal', transition: 'all 0.2s' }}>
                                📍 Local (Fixed)
                            </button>
                            <button type="button" onClick={() => setDim({...dim, loading_type: 'hub'})} style={{ padding: '6px 14px', border: 'none', background: dim.loading_type === 'hub' ? 'var(--brand-accent)' : 'transparent', color: dim.loading_type === 'hub' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: dim.loading_type === 'hub' ? '600' : 'normal', transition: 'all 0.2s' }}>
                                🏢 Hub (Variable)
                            </button>
                        </div>

                        {dim.loading_type === 'hub' && (
                            <div style={{ marginTop: '15px' }}>
                                <label className="input-label" style={{ fontSize: '11px', color: 'var(--brand-danger)' }}>Enter Hub Amount (₹)</label>
                                <input className="form-input" type="number" required value={dim.hub_loading_input} onChange={e => setDim({...dim, hub_loading_input: +e.target.value})} />
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>*Will be capped by partner max threshold if defined</span>
                            </div>
                        )}
                    </div>

                    {/* CUSTOM TOGGLE SWITCH: Delivery Type */}
                    <div style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <label className="input-label" style={{ marginBottom: '10px', display: 'block' }}>Final Delivery Type</label>
                        
                        <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden', width: 'fit-content' }}>
                            <button type="button" onClick={() => setDim({...dim, delivery_type: 'door'})} style={{ padding: '6px 14px', border: 'none', background: dim.delivery_type === 'door' ? 'var(--brand-accent)' : 'transparent', color: dim.delivery_type === 'door' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: dim.delivery_type === 'door' ? '600' : 'normal', transition: 'all 0.2s' }}>
                                🚪 Door
                            </button>
                            <button type="button" onClick={() => setDim({...dim, delivery_type: 'godown'})} style={{ padding: '6px 14px', border: 'none', background: dim.delivery_type === 'godown' ? 'var(--brand-accent)' : 'transparent', color: dim.delivery_type === 'godown' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: dim.delivery_type === 'godown' ? '600' : 'normal', transition: 'all 0.2s' }}>
                                🏭 Godown Hub
                            </button>
                        </div>
                        
                        <div style={{ fontSize: '11px', color: dim.delivery_type === 'door' ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '15px' }}>
                            {dim.delivery_type === 'door' ? "Requires manual distance mapping below." : "Distance mapping disabled. No ODA charges will apply."}
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', border: '1px dashed var(--brand-accent)' }}>
                        <label className="input-label" style={{ color: 'var(--brand-accent)' }}>Extra Hamali Adjustments</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                             <div><label className="input-label" style={{ fontSize: "11px" }}>Detail</label><input className="form-input" placeholder="e.g., Unloading" value={dim.hamali_detail} onChange={(e) => setDim({ ...dim, hamali_detail: e.target.value })} /></div>
                            <div><label className="input-label" style={{ fontSize: "11px" }}>Cost (₹)</label><input className="form-input" type="number" value={dim.hamali_cost} onChange={(e) => setDim({ ...dim, hamali_cost: +e.target.value })} /></div>
                        </div>
                    </div>
                </div>

                {dim.delivery_type === 'door' && (
                    <>
                        <h4 style={{ marginTop: 25, borderTop: "1px solid var(--border-light)", paddingTop: "15px" }}>Transporter Distance Mapping (Door Delivery)</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: "15px", marginTop: "10px" }}>
                            {partners.map((partner) => ( 
                                <div key={partner.id} style={{ border: "1px solid var(--border-light)", borderRadius: "8px", padding: "15px", background: "var(--bg-surface)" }}>
                                    <h4 style={{ margin: 0 }}>{partner.name}</h4>
                                    <p style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-muted)"}}>
                                        {partner.partner_link && (<a href={partner.partner_link} style={{color: 'var(--text-primary)'}} target="_blank" rel="noopener noreferrer" title="Open Partner Website">Find distance calculator here <FiExternalLink size={14} /></a>)}
                                    </p>
                                    <label className="input-label">Distance from Hub (KM)</label>
                                    <input type="number" min={1} className="form-input" value={partnerDistances[partner.id] || 0} onChange={(e) => setPartnerDistances({ ...partnerDistances, [partner.id]: Number(e.target.value) }) } />
                                </div>
                            ))}
                        </div>
                    </>
                )}
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
                                            <span>Destination Zone</span><strong>{opt.destination_zone}</strong>
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
                                      <button className="btn btn-success" onClick={() => confirmTransport(opt)} style={{ marginTop: '10px', width: '100%' }}>Select</button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {selectedTransport && (
                <div className="modal-overlay">
                    <div className="modal-box">
                          <h3>Confirmed Transport</h3>
                        <p>{selectedTransport.partner_name}</p>
                        <p>Final Cost: ₹{selectedTransport.dispatch_cost_gst}</p>
                        <button className="btn btn-primary" onClick={() => confirmTransport(selectedTransport)}>Print Invoice</button>
                        {" or "}
                        <button className="btn btn-secondary" onClick={() => setSelectedTransport(null)}>Close</button>
                    </div>
                </div>
            )}
            
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