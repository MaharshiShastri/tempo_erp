import React, { useState, useEffect, useRef } from "react";
import SearchBox from "../components/SearchBox";
import API from "../api/api"; 

export default function OrderEntryFormView({ state }) {
    const today = new Date().toISOString().split('T')[0];
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 5);
    const maxDateString = maxFutureDate.toISOString().split('T')[0];
    const [isOcrLoading, setIsOcrLoading] = useState(false);

    const [poSuggestions, setPoSuggestions] = useState([]);
    const [showPoSuggestions, setShowPoSuggestions] = useState(false);
    const poInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (poInputRef.current && !poInputRef.current.contains(event.target)) {
                setShowPoSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handlePoInputChange = async (e) => {
        const query = e.target.value;
        state.setOrderHeader({...state.orderHeader, purchase_order_number: query});
        
        if (query.length >= 2) {
            try {
                const data = await API.searchPOAutocomplete(query, state.user.access_token);
                
                const sortedData = data.sort((a, b) => {
                    const queryLower = query.toLowerCase();
                    const aLower = a.toLowerCase();
                    const bLower = b.toLowerCase();
                    
                    const aStarts = aLower.startsWith(queryLower);
                    const bStarts = bLower.startsWith(queryLower);
                    
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;
                    return a.localeCompare(b);
                });
                
                setPoSuggestions(sortedData);
                setShowPoSuggestions(true);
            } catch (err) {
                console.error("PO Autocomplete error:", err);
            }
        } else {
            setPoSuggestions([]);
            setShowPoSuggestions(false);
        }
    };

    const handlePOSearch = async (exactPoNumber) => {
        if (!exactPoNumber) return;
        
        setShowPoSuggestions(false); 
        
        try {
            state.setAlertMessage("Searching records for PO...");
            state.setIsAlertOpen(true);
            
            const r = await fetch(`/api/v1/orders/search/po/${exactPoNumber}`, {
                headers: { "Authorization": `Bearer ${state.user.access_token}` }
            });
            
            if (!r.ok) throw new Error("Purchase Order not found.");
            const data = await r.json();
            
            state.setOrderHeader({
                ...state.orderHeader,
                purchase_order_number: exactPoNumber,
                purchase_order_date: data.purchase_order_date,
                customer_code: data.customer_code,
                payment_terms: data.payment_terms || "",
                billing_name: data.billing_name,
                billing_address: data.billing_address,
                due_date: data.due_date,
                // ordered_by is now handled invisibly
            });
            
            if (data.items && data.items.length > 0) {
                state.setOrderItems(data.items);
            }
            
            state.setAlertMessage("✅ Existing Purchase Order data populated.");
        } catch (error) {
            state.showErrorModal("PO Lookup Failed", error.message);
        }
    };

    // --- Footer Calculations ---
    const itemSubtotal = state.orderItems.reduce((acc, item) => {
        return acc + ((item.quantity || 0) * (item.rate || 0) * (1 - (item.discount_percentage || 0) / 100));
    }, 0);

    const packingCharges = parseFloat(state.orderHeader.packing_charges || 0);
    const freightCharges = parseFloat(state.orderHeader.freight_charges || 0);
    const taxRate = parseFloat(state.orderHeader.tax_rate || 18); // Default to 18% GST
    const taxableAmount = itemSubtotal + packingCharges + freightCharges;
    const taxAmount = taxableAmount * (taxRate / 100);
    const grandTotal = taxableAmount + taxAmount;

    return (
        <div className="frappe-card">
            <div className="system-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Establish Order Acceptance Entity Payload</h3>
                
                <div style={{ position: 'relative' }}>
                    <input 
                        type="file" 
                        accept="image/png, image/jpeg, application/pdf" 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        disabled={isOcrLoading}
                    />
                    <button type="button" className="btn btn-secondary" style={{ background: '#e0e7ff', color: '#4f46e5', borderColor: '#c7d2fe' }} disabled={isOcrLoading}>
                        {isOcrLoading ? "Scanning Document..." : "🪄 Auto-Fill via AI OCR (PDF/Image)"}
                    </button>
                </div>
            </div>
            
            <form onSubmit={(e) => {
                // Ensure the implicit user email is attached right before submitting
                state.setOrderHeader(prev => ({...prev, ordered_by: state.user.email}));
                state.commitOrderSubmit(e);
            }}>
                <div className="form-grid-layout" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    
                    <div className="form-group">
                        <label className="input-label">Order Acceptance ID (Auto UUID Locked) *</label>
                        <input type="text" required className="form-input" value={state.orderHeader.order_acceptance_id} onChange={(e) => state.setOrderHeader({...state.orderHeader, order_acceptance_id: e.target.value.toUpperCase()})} placeholder="e.g. XXX/000" maxLength={30} />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Customer PO Ref *</label>
                        <div ref={poInputRef} style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" 
                                required 
                                className="form-input" 
                                value={state.orderHeader.purchase_order_number} 
                                onChange={handlePoInputChange}
                                onFocus={() => { if (poSuggestions.length > 0) setShowPoSuggestions(true); }}
                                placeholder="PO-XXXX" 
                            />
                            <button type="button" className="btn btn-secondary" onClick={() => handlePOSearch(state.orderHeader.purchase_order_number)} style={{ whiteSpace: 'nowrap' }}>
                                🔍 Lookup
                            </button>

                            {showPoSuggestions && poSuggestions.length > 0 && (
                                <ul style={{
                                    position: 'absolute', top: '100%', left: 0, width: 'calc(100% - 90px)', 
                                    background: 'var(--bg-main)', border: '1px solid var(--brand-accent)', 
                                    borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 0, 
                                    margin: '4px 0 0 0', listStyle: 'none', zIndex: 1000, maxHeight: '200px', overflowY: 'auto'
                                }}>
                                    {poSuggestions.map((po, index) => (
                                        <li 
                                            key={index} onClick={() => handlePOSearch(po)}
                                            style={{
                                                padding: '10px 12px', cursor: 'pointer', borderBottom: index === poSuggestions.length - 1 ? 'none' : '1px solid var(--border-light)',
                                                fontSize: '13px', fontWeight: po.toLowerCase().startsWith(state.orderHeader.purchase_order_number.toLowerCase()) ? 'bold' : 'normal', color: 'var(--text-primary)'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = 'var(--bg-surface)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            {po}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="input-label">Acceptance Date *</label>
                        <input type="date" required className="form-input" max={today} value={state.orderHeader.order_acceptance_date} onChange={e => state.setOrderHeader({...state.orderHeader, order_acceptance_date: e.target.value})} />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Customer PO Date *</label>
                        <input type="date" required className="form-input" max={today} value={state.orderHeader.purchase_order_date} onChange={e => state.setOrderHeader({...state.orderHeader, purchase_order_date: e.target.value})} />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Delivery Expiry Due Date *</label>
                        <input type="date" required className="form-input" min={today} max={maxDateString} value={state.orderHeader.due_date} onChange={e =>{let val = e.target.value; if (val) {const yearPart = val.split('-')[0]; if (yearPart.length > 4) {return;}} state.setOrderHeader({...state.orderHeader, due_date: e.target.value});}} />
                    </div>
                    
                    <div className="form-group">
                        <label className="input-label">Payment Deadlines Terms</label>
                        <input type="text" className="form-input" value={state.orderHeader.payment_terms} onChange={e => state.setOrderHeader({...state.orderHeader, payment_terms: e.target.value})} placeholder="e.g. Net 30 Days" />
                    </div>

                    <div className="form-group grid-span-3" style={{ marginTop: '8px' }}>
                        <label className="input-label" style={{ color: 'var(--brand-accent)' }}>Link Master Corporate Client Registry Account *</label>
                        <SearchBox searchUrl="/api/v1/orders/search/companies" placeholder="Search customer (type name or code)..." onSelect={(cust) => { state.handleCustomerMasterSelection(cust.id); }}/>
                    </div>

                    <div className="form-group grid-span-3" style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid var(--border-light)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                            <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer' }} checked={state.isBillingSameAsCustomer} onChange={e => state.setIsBillingSameAsCustomer(e.target.checked)} />
                            <strong>Billing parameters and Customer Entity details are identical</strong>
                        </label>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: state.isBillingSameAsCustomer ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: state.isBillingSameAsCustomer ? 'var(--brand-success)' : 'var(--brand-danger)' }}>
                            {state.isBillingSameAsCustomer ? "AUTO-MATCH ON" : "OVERRIDE OFF"}
                        </span>
                    </div>

                    {!state.isBillingSameAsCustomer && (
                        <React.Fragment>
                            <div className="form-group grid-span-3">
                                <label className="input-label" style={{ color: 'var(--brand-danger)' }}>Override Billing Corporate Legal Name *</label>
                                <input type="text" required className="form-input" value={state.orderHeader.billing_name} onChange={e => state.setOrderHeader({...state.orderHeader, billing_name: e.target.value})} placeholder="Enter distinct commercial recipient name..." />
                            </div>
                            <div className="form-group grid-span-3">
                                <label className="input-label" style={{ color: 'var(--brand-danger)' }}>Override Billing Core Street Address Block *</label>
                                <textarea required className="form-input" rows="2" style={{ height: 'auto' }} value={state.orderHeader.billing_address} onChange={e => state.setOrderHeader({...state.orderHeader, billing_address: e.target.value})} placeholder="Enter distinct drop-off logistics routing target..." />
                            </div>
                        </React.Fragment>
                    )}

                    {state.isBillingSameAsCustomer && state.orderHeader.customer_code && (
                        <div className="form-group grid-span-3" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            ℹ️ Inheriting: <strong>{state.orderHeader.billing_name}</strong> at <em>{state.orderHeader.billing_address}</em>
                        </div>
                    )}
                </div>

                <h4 style={{ marginTop: '25px', marginBottom: '10px', color: 'var(--brand-accent)', fontSize: '14px' }}>Dynamic Line-Items Matrix Grid</h4>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '15%' }}>Target Stock Code *</th>
                                <th style={{ width: '35%' }}>Specifications Description *</th>
                                <th style={{ width: '8%' }}>HSN Code</th>
                                <th style={{ width: '6%' }}>Qty *</th>
                                <th style={{ width: '6%' }}>Per *</th>
                                <th style={{ width: '8%' }}>Rate *</th>
                                <th style={{ width: '8%' }}>Disc %</th>
                                <th style={{ width: '10%', textAlign: 'right' }}>Calculated Amount</th>
                                <th style={{ width: '4%' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {state.orderItems.map((item, index) => {
                                const lineTotal = (item.quantity || 0) * (item.rate || 0) * (1 - (item.discount_percentage || 0) / 100);
                                return (
                                    <tr key={index}>
                                        <td>
                                            <select className="form-select-native" value={item.item_code} onChange={e => state.handleItemMasterSelection(index, e.target.value)} required>
                                                <option value="">-- Choose --</option>
                                                {state.itemsMaster?.map(im => <option key={im.item_code} value={im.item_code}>{im.item_code}</option>)}
                                                <option value="TRIGGER_ERR_UNREGISTERED_PART">Non-standard Code</option>
                                            </select>
                                        </td>
                                        <td>
                                            <textarea 
                                                required 
                                                className="form-input" 
                                                rows="3" 
                                                style={{ resize: 'vertical', width: '100%', minHeight: '60px', fontFamily: 'sans-serif' }}
                                                value={item.additional_spec_text} 
                                                onChange={e => state.updateOrderItemField(index, 'additional_spec_text', e.target.value)} 
                                                placeholder="Enter detailed specifications..." 
                                            />
                                        </td>
                                        <td>
                                            <input type="text" className="form-input" value={item.hsn_code} onChange={e => state.updateOrderItemField(index, 'hsn_code', e.target.value)} placeholder="HSN" />
                                        </td>
                                        <td>
                                            <input type="number" required min="1" className="form-input" value={item.quantity} onChange={e => state.updateOrderItemField(index, 'quantity', parseInt(e.target.value) || 0)} />
                                        </td>
                                        <td>
                                            <input type="text" required className="form-input" value={item.unit_measure} onChange={e => state.updateOrderItemField(index, 'unit_measure', e.target.value)} placeholder="NOS" />
                                        </td>
                                        <td>
                                            <input type="number" required step="0.01" min="0" className="form-input" value={item.rate} onChange={e => state.updateOrderItemField(index, 'rate', parseFloat(e.target.value) || 0)} />
                                        </td>
                                        <td>
                                            <input type="number" required step="0.01" min="0.00" max="100.00" className="form-input" value={item.discount_percentage} onChange={e => state.updateOrderItemField(index, 'discount_percentage', parseFloat(e.target.value) || 0.00)} />
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--text-muted)' }}>₹{lineTotal.toFixed(2)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            {state.orderItems.length > 1 && (
                                                <button type="button" className="btn-text-danger" onClick={() => state.popOrderItemRow(index)}>Remove</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <button type="button" className="btn btn-secondary" style={{ marginTop: '12px' }} onClick={state.appendOrderItemRow}>+ Append Line Row Node</button>
                
                {/* --- FINANCIAL FOOTER --- */}
                <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', width: '350px', marginLeft: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted)' }}>
                        <span>Item Subtotal:</span>
                        <strong>₹{itemSubtotal.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px' }}>Packing Charges (₹):</span>
                        <input type="number" step="0.01" className="form-input" style={{ width: '120px', padding: '4px 8px', textAlign: 'right' }} value={state.orderHeader.packing_charges || ''} onChange={e => state.setOrderHeader({...state.orderHeader, packing_charges: e.target.value})} placeholder="0.00" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px' }}>Freight Charges (₹):</span>
                        <input type="number" step="0.01" className="form-input" style={{ width: '120px', padding: '4px 8px', textAlign: 'right' }} value={state.orderHeader.freight_charges || ''} onChange={e => state.setOrderHeader({...state.orderHeader, freight_charges: e.target.value})} placeholder="0.00" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px' }}>GST Rate (%):</span>
                        <select className="form-select-native" style={{ width: '120px', padding: '4px 8px' }} value={state.orderHeader.tax_rate || 18} onChange={e => state.setOrderHeader({...state.orderHeader, tax_rate: e.target.value})}>
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted)' }}>
                        <span>Tax Amount (CGST/SGST/IGST):</span>
                        <strong>₹{taxAmount.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid var(--border-light)', fontSize: '16px' }}>
                        <strong>Grand Total:</strong>
                        <strong style={{ color: 'var(--brand-accent)' }}>₹{grandTotal.toFixed(2)}</strong>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => state.setActiveTab('orders-list')}>Discard Form</button>
                    <button type="submit" className="btn btn-primary">Commit Order Records<kbd style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.8 }}>Ctrl+S</kbd></button>
                </div>
            </form>
        </div>
    );
};