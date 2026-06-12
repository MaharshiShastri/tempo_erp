import React from 'react';

export default function ItemMasterView({ state }) {

    return (
        <div className="frappe-card">
            <div className="system-header">
                <h3>📦 Enterprise Inventory & Item Master</h3>
                <button className="btn btn-primary" onClick={() => state.setActiveTab("item-create")}>
                    + New SKU
                </button>
            </div>

            {/* Existing Items Ledger */}
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '15px' }}>Current Master Catalog</h4>
            <div style={{ overflowX: 'auto' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Product Code</th>
                            <th>Product Name</th>
                            <th>Category Group</th>
                            <th>UoM</th>
                            <th style={{ textAlign: 'right' }}>Standard Base Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.itemsMaster && state.itemsMaster?.length ? (
                            state.itemsMaster.map(item => (
                                <tr key={item.item_code}>
                                    <td><span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.item_code}</span></td>
                                    <td>{item.item_name}</td>
                                    <td><span style={{ background: 'var(--combobox-hover)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>{item.item_group || 'General'}</span></td>
                                    <td>{item.unit_measure}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{parseFloat(item.rate).toFixed(2)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No products found in the database.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}