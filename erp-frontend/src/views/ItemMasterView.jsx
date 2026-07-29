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
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '15px' }}>Current Master Catalog ({state.itemsMaster?.length})</h4>
            <div style={{ overflowX: 'auto' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Product Code</th>
                            <th>Product Name</th>
                            <th>Category Group</th>
                            <th style={{textAlign:"center"}}>Available Stock</th>
                            <th>UoM</th>
                            <th style={{ textAlign: 'right' }}>Standard Base Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.itemsMaster && state.itemsMaster?.length ? (
                            state.itemsMaster?.slice().
                            sort((a,b)=> a.item_code.localeCompare(b.item_code)).map(item => (
                                <tr key={item.item_code}>
                                    <td><span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.item_code}</span></td>
                                    <td>{item.item_name}</td>
                                    <td><span style={{ background: 'var(--combobox-hover)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>{item.item_group || 'General'}</span></td>
                                    <td style={{textAlign:"center",fontWeight:"bold"}}>
                                        <div className='stock-cell'>
                                            <span className='stock-value'>{item.available_stock}</span>
                                            {['Admin','Chief Full Stack Developer','Shop Floor Administrator'].includes(state.user.role) && (
                                                <button className='stock-adjust-btn' onClick={()=>state.openStockModal(item)}>+Adjust</button>)}
                                        </div>
                                    </td>
                                    <td>{item.unit_measure}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{parseFloat(item.rate).toFixed(2)}</td>
                                </tr>
                            )).sort()
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No products found in the database.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {state.stockModalOpen && (
                <div className="modal-overlay">

                    <div className="frappe-card" style={{maxWidth:500}}>

                        <h3>Adjust Inventory</h3>

                        <p><strong>{state.selectedItem.item_name}</strong></p>

                        <p>Current Stock: <strong>{state.selectedItem.available_stock}</strong></p>

                        <div className="form-group">

                            <label>Operation</label>

                            <select className="form-input" value={state.stockModal.operation} onChange={(e)=> state.setStockModal({ ...state.stockModal,operation:e.target.value})}>

                                <option value="add">Add Stock</option>

                                <option value="subtract">Remove Stock</option>

                                <option value="set">Set Exact Quantity</option>

                            </select>

                        </div>

                        <div className="form-group">

                            <label>Quantity</label>

                            <input type="number" min={0} className="form-input" value={state.stockModal.quantity} onChange={(e)=>state.setStockModal({ ...state.stockModal,quantity:Number(e.target.value)})}/>

                        </div>
                        
                        <div className='form-group'>
                            <label>Remarks</label>
                            <input type="text" className='form-input' value={state.stockModal.remarks} onChange={(e)=>{state.setStockModal({...state.stockModal, remarks: e.target.value})}} />

                        </div>
                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10}}>

                            <button className="btn-text" onClick={state.closeStockModal}>Cancel</button>

                            <button className="btn-primary" onClick={state.saveStockAdjustment}>Save</button>

                        </div>

                    </div>

                </div>
            )}
        </div>
    );
}