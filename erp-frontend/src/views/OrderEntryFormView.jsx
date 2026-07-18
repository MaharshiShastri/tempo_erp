import React, { useState, useEffect, useRef } from "react";
import SearchBox from "../components/SearchBox";
import API from "../api/api"; 

export default function OrderEntryFormView({ state }) {
    const {orderHeader, setOrderHeader, orderItems, setOrderItems, appendOrderItemRow, popOrderItemRow, updateOrderItemField,
        handleCustomerMasterSelection, oaSuggestions, showOaSuggestions, oaInputRef, handleOaInputChange, handleOaSelect, handleOaSearch, 
        isNewClient, setIsNewClient, temporaryClientName, setTemporaryClientName, handleFormSubmit, totals,
        isOcrLoading, isBillingSameAsCustomer, setIsBillingSameAsCustomer, itemsMaster,setActiveTab, 
    } = state;
    
    const today = new Date().toISOString().split('T')[0];
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 5);
    const maxDateString = maxFutureDate.toISOString().split('T')[0];
        
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
            
            <form onSubmit={handleFormSubmit}>
                <div className="form-grid-layout" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    
                    <div className="form-group">
                        <label className="input-label">Order Acceptance ID (Staged Search) *</label>
                        <div ref={oaInputRef} style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" 
                                required 
                                className="form-input" 
                                value={orderHeader.order_acceptance_id} 
                                onChange={handleOaInputChange}
                                onFocus={() => { if (oaSuggestions.length > 0) setShowOaSuggestions(true); }}
                                placeholder="XXX/000" 
                                maxLength={7}
                            />
                            <button type="button" className="btn btn-secondary" onClick={() => handleOaSearch(orderHeader.order_acceptance_id)} style={{ whiteSpace: 'nowrap' }}>
                                🔍 Lookup
                            </button>

                            {showOaSuggestions && oaSuggestions.length > 0 && (
                                <ul style={{
                                    position: 'absolute', top: '100%', left: 0, width: 'calc(100% - 90px)', 
                                    background: 'var(--bg-main)', border: '1px solid var(--brand-accent)', 
                                    borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 0, 
                                    margin: '4px 0 0 0', listStyle: 'none', zIndex: 1000, maxHeight: '200px', overflowY: 'auto'
                                }}>
                                    {oaSuggestions.map((oa, index) => (
                                        <li 
                                            key={index} onClick={() => handleOaSelect(oa)}
                                            style={{
                                                padding: '10px 12px', cursor: 'pointer', borderBottom: index === oaSuggestions.length - 1 ? 'none' : '1px solid var(--border-light)',
                                                fontSize: '13px', 
                                                fontWeight: oa.toLowerCase().includes(orderHeader.order_acceptance_id.toLowerCase()) ? 'bold' : 'normal', 
                                                color: 'var(--text-primary)'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = 'var(--bg-surface)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            {oa}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="input-label">Customer PO Ref *</label>
                        <input type="text" required className="form-input" value={orderHeader.purchase_order_number} onChange={e => setOrderHeader({...orderHeader, purchase_order_number: e.target.value})} placeholder="PO-XXXX" />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Acceptance Date *</label>
                        <input type="date" required className="form-input" max={today} value={orderHeader.order_acceptance_date} onChange={e => setOrderHeader({...orderHeader, order_acceptance_date: e.target.value})} />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Customer PO Date *</label>
                        <input type="date" required className="form-input" max={today} value={orderHeader.purchase_order_date} onChange={e => setOrderHeader({...orderHeader, purchase_order_date: e.target.value})} />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Delivery Expiry Due Date *</label>
                        <input type="date" required className="form-input" min={today} max={maxDateString} value={orderHeader.due_date} onChange={e =>{let val = e.target.value; if (val) {const yearPart = val.split('-')[0]; if (yearPart.length > 4) {return;}} setOrderHeader({...orderHeader, due_date: e.target.value});}} />
                    </div>
                    
                    <div className="form-group">
                        <label className="input-label">Payment Deadlines Terms</label>
                        <input type="text" className="form-input" value={orderHeader.payment_terms} onChange={e => setOrderHeader({...orderHeader, payment_terms: e.target.value})} placeholder="e.g. Net 30 Days" />
                    </div>

                    {/* Master Registration & Toggle Block */}
                    <div className="form-group grid-span-3" style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="input-label" style={{ color: 'var(--brand-accent)', margin: 0 }}>Link Master Corporate Client Registry Account *</label>
                            <button 
                                type="button" 
                                className="btn" 
                                style={{ padding: '2px 8px', fontSize: '11px', background: isNewClient ? 'var(--brand-danger)' : 'var(--brand-success)', color: 'white', border: 'none' }}
                                onClick={() => {
                                    setIsNewClient(!isNewClient);
                                    if(!isNewClient) setOrderHeader(p => ({...p, customer_code: ""}));
                                }}
                            >
                                {isNewClient ? "✕ Link Existing Client Instead" : "＋ Register New Client Profile Post-Submit"}
                            </button>
                        </div>
                        
                        {!isNewClient ? (
                            <SearchBox 
                                searchUrl="/api/v1/orders/search/companies" 
                                placeholder="Search customer (type name or code)..." 
                                onSelect={(cust) => { handleCustomerMasterSelection(cust.id); }}
                            />
                        ) : (
                            <input 
                                type="text" 
                                required 
                                className="form-input" 
                                style={{ border: '1px dashed var(--brand-success)' }}
                                value={temporaryClientName}
                                onChange={(e) => {
                                    setTemporaryClientName(e.target.value);
                                    if (isBillingSameAsCustomer) {
                                        setOrderHeader(prev => ({...prev, billing_name: e.target.value}));
                                    }
                                }}
                                placeholder="Enter temporary client corporate name here..." 
                            />
                        )}
                    </div>

                    <div className="form-group grid-span-3" style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid var(--border-light)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                            <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer' }} checked={isBillingSameAsCustomer} onChange={e => setIsBillingSameAsCustomer(e.target.checked)} />
                            <strong>Billing parameters and Customer Entity details are identical</strong>
                        </label>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: isBillingSameAsCustomer ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isBillingSameAsCustomer ? 'var(--brand-success)' : 'var(--brand-danger)' }}>
                            {isBillingSameAsCustomer ? "AUTO-MATCH ON" : "OVERRIDE OFF"}
                        </span>
                    </div>

                    {!isBillingSameAsCustomer && (
                        <React.Fragment>
                            <div className="form-group grid-span-3">
                                <label className="input-label" style={{ color: 'var(--brand-danger)' }}>Override Billing Corporate Legal Name *</label>
                                <input type="text" required className="form-input" value={orderHeader.billing_name} onChange={e => setOrderHeader({...orderHeader, billing_name: e.target.value})} placeholder="Enter distinct commercial recipient name..." />
                            </div>
                            <div className="form-group grid-span-3">
                                <label className="input-label" style={{ color: 'var(--brand-danger)' }}>Override Billing Core Street Address Block *</label>
                                <textarea required className="form-input" rows="2" style={{ height: 'auto' }} value={orderHeader.billing_address} onChange={e => setOrderHeader({...orderHeader, billing_address: e.target.value})} placeholder="Enter distinct drop-off logistics routing target..." />
                            </div>
                        </React.Fragment>
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
                            {orderItems.map((item, index) => {
                                const lineTotal = (item.quantity || 0) * (item?.rate || 0) * (1 - (item.discount_percentage || 0) / 100);
                                return (
                                    <tr key={index}>
                                        <td>
                                            <select 
                                                className="form-select-native" 
                                                value={item.item_code} 
                                                onChange={e => handleItemMasterSelection(index, 'item_code', e.target.value)} 
                                                required
                                            >
                                                <option value="">-- Choose --</option>
                                                {itemsMaster?.map(im => <option key={im.item_code} value={im.item_code}>{im.item_code}</option>)}
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
                                                onChange={e => updateOrderItemField(index, 'additional_spec_text', e.target.value)} 
                                                placeholder="Enter detailed specifications..." 
                                            />
                                        </td>
                                        <td>
                                            <input type="text" className="form-input" value={item.hsn_code} onChange={e => updateOrderItemField(index, 'hsn_code', e.target.value)} placeholder="HSN" />
                                        </td>
                                        <td>
                                            {/* Fix: Safely map quantity allowing for 0 to show, and correct the onChange input parsing */}
                                            <input 
                                                type="number" 
                                                required 
                                                min="0" 
                                                className="form-input" 
                                                value={item.quantity ?? 0} 
                                                onChange={e => {
                                                    const val = e.target.value; 
                                                    updateOrderItemField(index, 'quantity', val === '' ? '' : Number(val));
                                                }} 
                                            />
                                        </td>
                                        <td>
                                            <input type="text" required className="form-input" value={item.unit_measure} onChange={e => updateOrderItemField(index, 'unit_measure', e.target.value)} placeholder="NOS" />
                                        </td>
                                        <td>
                                            <input type="number" required step="0.01" min="0" className="form-input" value={item.rate || 0.00} onChange={e => updateOrderItemField(index, 'rate', parseFloat(e.target.value) || 0)} />
                                        </td>
                                        <td>
                                            <input type="number" required step="0.01" min="0.00" max="100.00" className="form-input" value={item.discount_percentage} onChange={e => updateOrderItemField(index, 'discount_percentage', parseFloat(e.target.value) || 0.00)} />
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--text-muted)' }}>₹{lineTotal.toFixed(2)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            {orderItems.length > 1 && (
                                                <button type="button" className="btn-text-danger" onClick={() => popOrderItemRow(index)}>Remove</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <button type="button" className="btn btn-secondary" style={{ marginTop: '12px' }} onClick={appendOrderItemRow}>+ Append Line Row Node</button>
                
                <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', width: '350px', marginLeft: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted)' }}>
                        <span>Item Subtotal:</span>
                        <strong>₹{totals.itemSubtotal.toFixed(2)}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px' }}>Packing Charges (₹):</span>
                        <input type="number" step="0.01" className="form-input" style={{ width: '120px', padding: '4px 8px', textAlign: 'right' }} value={orderHeader.packing_charges || ''} onChange={e => setOrderHeader({...orderHeader, packing_charges: e.target.value})} placeholder="0.00" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px' }}>Freight Charges (₹):</span>
                        <input type="number" step="0.01" className="form-input" style={{ width: '120px', padding: '4px 8px', textAlign: 'right' }} value={orderHeader.freight_charges || ''} onChange={e => setOrderHeader({...orderHeader, freight_charges: e.target.value})} placeholder="0.00" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px' }}>GST Rate (%):</span>
                        <select className="form-select-native" style={{ width: '120px', padding: '4px 8px' }} value={orderHeader.tax_rate || 18} onChange={e => setOrderHeader({...orderHeader, tax_rate: e.target.value})}>
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted)' }}>
                        <span>Tax Amount (CGST/SGST/IGST):</span>
                        <strong>₹{totals.taxAmount.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid var(--border-light)', fontSize: '16px' }}>
                        <strong>Grand Total:</strong>
                        <strong style={{ color: 'var(--brand-accent)' }}>₹{totals.grandTotal.toFixed(2)}</strong>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('orders-list')}>Discard Form</button>
                    <button type="submit" className="btn btn-primary">Commit Order Records<kbd style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.8 }}>Ctrl+S</kbd></button>
                </div>
            </form>
        </div>
    );
};