import React from "react";

export default function ItemMasterDetailView({ state }) {
    const item = state.itemDetail;
    if (!item) {
        return (<div className="frappe-card">Item not found.</div>);
    }

    return (
        <div className="frappe-card">
            <div className="system-header">
                <h3>
                    📦 {item.item_code}
                </h3>
            </div>

            <div className="form-grid-layout">
                <div className="form-group">
                    <label>Product Name</label>
                    <input className="form-input" value={item.item_name} disabled />
                </div>

                <div className="form-group">
                    <label>HSN Code</label>

                    <input className="form-input" value={item.hsn_code || ""} disabled />
                </div>

            </div>

            <div className="form-group">
                <label>
                    Technical Specification
                </label>

                <textarea rows="5" className="form-input" value={ item.additional_spec_text || "" } disabled />
            </div>

            <div style={{ display: "flex", gap: "10px" }} >
                <button className="btn" onClick={() => state.setActiveTab( "items-master" ) } > 
                    Back
                </button>

                <button className="btn btn-primary" >
                    Edit
                </button>

                <button className="btn btn-danger" >
                    Disable
                </button>

            </div>

        </div>
    );
}