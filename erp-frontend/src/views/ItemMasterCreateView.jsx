import React from "react";
export default function ItemMasterCreateView({state}) {
    const productGroups = [
        "Cements",
        "Dairy&Veterinary",
        "Flexotherm",
        "Flexotherm in Cements",
        "Ovens",
        "Rubber",
        "Others"
    ];
    return(
        <div className="frappe-card">
            <div className="system-header">
                <h3>➕ Create Product SKU</h3>
            </div>
            <form onSubmit={state.commitItemSubmit} style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '30px' }}>
                <h4 style={{ margin: '0 0 15px 0' }}>Provision New Product SKU</h4>
                <div className="form-grid-layout" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                    <div className="form-group">
                        <label className="input-label">Product Code (SKU) *</label>
                        <input type="text" required className="form-input" value={state.itemForm.item_code} onChange={e => state.setItemForm({...state.itemForm, item_code: e.target.value})} placeholder="e.g. TEMPO-100" />
                    </div>
                    <div className="form-group grid-span-2">
                        <label className="input-label">Product Name / Description *</label>
                        <input type="text" required className="form-input" value={state.itemForm.item_name} onChange={e => state.setItemForm({...state.itemForm, item_name: e.target.value})} placeholder="Precision Thermocouple..." />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Product Group *</label>
                        <select className="form-select-native" required value={state.itemForm.item_group} onChange={e => state.setItemForm({...state.itemForm, item_group: e.target.value})}>
                            <option value="">-- Assign Category --</option>
                            {productGroups.map(pg => <option key={pg} value={pg}>{pg}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="input-label">Base Price (₹) *</label>
                        <input type="number" step="0.01" min="0" required className="form-input" value={state.itemForm.rate} onChange={e => state.setItemForm({...state.itemForm, rate: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div className="form-group">
                        <label className="input-label">UoM *</label>
                        <input type="text" required className="form-input" value={state.itemForm.unit_measure} onChange={e => state.setItemForm({...state.itemForm, unit_measure: e.target.value})} placeholder="NOS, KG, MTR" />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary">Save to Inventory DB</button>
                </div>
                <div className="form-group">
                    <label className="input-label">HSN Code</label>

                    <input type="text" className="form-input" value={state.itemForm.hsn_code} onChange={e => state.setItemForm({ ...state.itemForm, hsn_code: e.target.value }) } />
                </div>
                <div className="form-group">
                    <label className="input-label">Revision No</label>

                    <input type="text" className="form-input" value={state.itemForm.revision_no} onChange={e =>state.setItemForm({ ...state.itemForm, revision_no: e.target.value }) } />
                </div>
                <div className="form-group grid-span-5">
                    <label className="input-label">Technical Specification</label>

                    <textarea rows="4" className="form-input" value={state.itemForm.additional_spec_text} onChange={e => state.setItemForm({ ...state.itemForm, additional_spec_text: e.target.value }) } />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px"}} >
                    <button type="button" className="btn" onClick={() => state.setActiveTab("items-master") } >
                        Cancel
                    </button>

                    <button type="submit" className="btn btn-primary" >
                        Save SKU
                    </button>
                </div>
            </form>
        </div>
    );
};