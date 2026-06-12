import React from "react";
import SearchBox from "../components/SearchBox";
export default function OrderEntryFormView({ state }) {
    const today = new Date().toISOString().split('T')[0];
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 5);
    const maxDateString = maxFutureDate.toISOString().split('T')[0];

    return (
        <div className="frappe-card">
            <div className="system-header">
                <h3>Establish Order Acceptance Entity Payload</h3>
            </div>
            <form onSubmit={state.commitOrderSubmit}>
                <div className="form-grid-layout" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                        <label className="input-label">Order Acceptance ID (Auto UUID Locked) *</label>
                        <input type="text" required className="form-input" value={state.orderHeader.order_acceptance_id} onChange={(e) => state.setOrderHeader({...state.orderHeader, order_acceptance_id: e.target.value.toUpperCase()})} placeholder="e.g. XXX/000" maxLength={30} />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Acceptance Date *</label>
                        <input type="date" required className="form-input" max={today} value={state.orderHeader.order_acceptance_date} onChange={e => state.setOrderHeader({...state.orderHeader, order_acceptance_date: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Customer PO Ref *</label>
                        <input type="text" required className="form-input" value={state.orderHeader.purchase_order_number} onChange={e => state.setOrderHeader({...state.orderHeader, purchase_order_number: e.target.value})} placeholder="PO-XXXX" />
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
                                <th style={{ width: '25%' }}>Specifications Description *</th>
                                <th style={{ width: '10%' }}>HSN Code</th>
                                <th style={{ width: '8%' }}>Qty *</th>
                                <th style={{ width: '8%' }}>Per *</th>
                                <th style={{ width: '10%' }}>Rate *</th>
                                <th style={{ width: '10%' }}>Discount %</th>
                                <th style={{ width: '12%', textAlign: 'right' }}>Calculated Amount</th>
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
                                                {state.itemsMaster.map(im => <option key={im.item_code} value={im.item_code}>{im.item_code}</option>)}
                                                <option value="TRIGGER_ERR_UNREGISTERED_PART">Non-standard Code</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input type="text" required className="form-input" value={item.additional_spec_text} onChange={e => state.updateOrderItemField(index, 'additional_spec_text', e.target.value)} placeholder="Enter mandatory specifications..." />
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => state.setActiveTab('orders-list')}>Discard Form</button>
                    <button type="submit" className="btn btn-primary">Commit Order Records<kbd style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.8 }}>Ctrl+S</kbd></button>
                </div>
            </form>
        </div>
    );
};
