import { FiUploadCloud, FiPlus, FiTrash2, FiSave, FiDownload, FiAlertCircle, FiPackage } from "react-icons/fi";
import API from "../api/api";

export default function GRN_WorkspaceView({ state }) {
    const {scannedData, isScanning, fileInputRef, handleFileUpload, updateHeader, updateItem, verifyItemCode, addNewRow,
        removeRow, exportExcel, handleSaveInit, showUnmappedModal, setShowUnmappedModal, unmappedDrafts, handleDraftChange,
        handleRegisterAndSave, handleProceedWithoutAdding
    } = state
    return (
        <div className="frappe-card" style={{ maxWidth: 1400, margin: "0 auto", padding: 25 }}>
            <div className="system-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiPackage /> Goods Receipt Note (GRN) Desk
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Vendor Invoice to BOM Auto-Mapper</p>
                </div>
                <div>
                    <input type="file" accept="image/jpeg, image/png, application/pdf" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                    <button className="btn btn-secondary" style={{ background: "var(--brand-accent)", color: "#fff", border: "none" }} onClick={() => fileInputRef.current.click()} disabled={isScanning}>
                        {isScanning ? "⏳ Processing OCR..." : <><FiUploadCloud size={16} /> Scan Vendor Invoice</>}
                    </button>
                </div>
            </div>

            {scannedData && (
                <div style={{ marginTop: "30px", animation: "fadeIn 0.5s ease-in-out" }}>
                    
                    <div className="form-grid-layout" style={{ background: "var(--bg-surface)", padding: "20px", borderRadius: "var(--radius-sm)", marginBottom: "20px", border: "1px solid var(--border-light)" }}>
                        <div className="form-group">
                            <label className="input-label">Vendor Name</label>
                            <input className="form-input" value={scannedData.vendor_name} onChange={(e) => updateHeader("vendor_name", e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Vendor Invoice No.</label>
                            <input className="form-input" value={scannedData.invoice_number} onChange={(e) => updateHeader("invoice_number", e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Internal GRN Assignment</label>
                            <input className="form-input" disabled value={scannedData.grn_number} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Material Line Items</h4>
                        <button className="btn btn-secondary" onClick={addNewRow} style={{ padding: '6px 12px', fontSize: '12px' }}>
                            <FiPlus /> Add Row
                        </button>
                    </div>

                    <div style={{ overflowX: "auto", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ background: "var(--bg-sidebar)", textAlign: "left", borderBottom: "2px solid var(--border-light)" }}>
                                    <th style={{ padding: "12px", width: "16%" }}>Item Code *</th>
                                    <th style={{ padding: "12px", width: "24%" }}>Description</th>
                                    <th style={{ padding: "12px", width: "8%" }}>Qty</th>
                                    <th style={{ padding: "12px", width: "10%" }}>Rate</th>
                                    <th style={{ padding: "12px", width: "10%", background: "var(--bg-main)" }}>Gross</th>
                                    <th style={{ padding: "12px", width: "8%" }}>Disc %</th>
                                    <th style={{ padding: "12px", width: "10%", background: "var(--bg-main)" }}>Disc Amt</th>
                                    <th style={{ padding: "12px", width: "10%", color: "var(--brand-accent)" }}>Net Amt</th>
                                    <th style={{ padding: "12px", width: "4%", textAlign: "center" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {scannedData.items.map((item, idx) => (
                                    <tr key={idx} style={{ 
                                        borderBottom: "1px solid var(--border-light)",
                                        background: item.isMatched ? "var(--bg-surface)" : "var(--warning-row)",
                                        transition: "background 0.2s"
                                    }}>
                                        <td style={{ padding: "10px" }}>
                                            <input 
                                                className="form-input" 
                                                style={{ border: item.isMatched ? "1px solid var(--border-subtle)" : "1px solid var(--brand-danger)" }}
                                                value={item.item_code} 
                                                required
                                                onChange={(e) => updateItem(idx, "item_code", e.target.value)}
                                                onBlur={(e) => verifyItemCode(idx, e.target.value)}
                                                placeholder="Code..."
                                            />
                                            {!item.isMatched && <div style={{ fontSize: "10px", color: "var(--brand-danger)", marginTop: "4px", fontWeight: "bold", display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FiAlertCircle /> Unmapped
                                            </div>}
                                        </td>
                                        <td style={{ padding: "10px" }}>
                                            <input className="form-input" required value={item.item_name} onChange={(e) => updateItem(idx, "item_name", e.target.value)} />
                                            {item.item_description && (<div style={{marginTop: "6px", padding: "6px 8px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", fontSize: "11px", color: "var(--text-muted)"}}><strong>Matched Spec:</strong><br/>{item.item_description}</div>)}
                                        </td>
                                        <td style={{ padding: "10px" }}>
                                            <input type="number" className="form-input" required value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
                                        </td>
                                        <td style={{ padding: "10px" }}>
                                            <input type="number" step="0.01" className="form-input" required value={item.rate} onChange={(e) => updateItem(idx, "rate", e.target.value)} />
                                        </td>
                                        
                                        <td style={{ padding: "10px", background: "var(--bg-main)", color: "var(--text-muted)", fontWeight: "500" }}>
                                            ₹{(item.gross_amount || 0).toFixed(2)}
                                        </td>

                                        <td style={{ padding: "10px" }}>
                                            <input type="number" step="0.01" className="form-input" value={item.discount_percent || 0} onChange={(e) => updateItem(idx, "discount_percent", e.target.value)} />
                                        </td>
                                        
                                        <td style={{ padding: "10px", background: "var(--bg-main)", color: "var(--brand-danger)", fontWeight: "500" }}>
                                            ₹{(item.discount_amount || 0).toFixed(2)}
                                        </td>

                                        <td className="grn-amount-cell" style={{ padding:"10px" }}>
                                            ₹{(item.net_amount || 0).toFixed(2)}
                                        </td>
                                        
                                        <td style={{ padding: "10px", textAlign: "center" }}>
                                            <button className="btn-text-danger" onClick={() => removeRow(idx)} title="Delete Row">
                                                <FiTrash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                        <div style={{ width: "360px", padding: "15px", background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
                            
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>Gross Total:</span>
                                <strong>₹{(scannedData.gross_total || 0).toFixed(2)}</strong>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{ color: "var(--brand-danger)", fontSize: "13px" }}>Total Item Discounts (-):</span>
                                <strong style={{ color: "var(--brand-danger)" }}>₹{(scannedData.discount_total || 0).toFixed(2)}</strong>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderTop: "1px dashed var(--border-light)", paddingTop: "8px" }}>
                                <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: "600" }}>Subtotal (Taxable):</span>
                                <strong style={{ fontSize: "14px" }}>₹{(scannedData.subtotal || 0).toFixed(2)}</strong>
                            </div>
                                                                                    
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>SGST (9%):</span>
                                <strong>₹{scannedData.taxes.sgst.toFixed(2)}</strong>
                            </div>
                            
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>CGST (9%):</span>
                                <strong>₹{scannedData.taxes.cgst.toFixed(2)}</strong>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", color: "var(--brand-accent)", paddingTop: "5px" }}>
                                <strong>Grand Total:</strong>
                                <strong>₹{scannedData.grand_total.toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", gap: "10px" }}>
                        <button className="btn btn-secondary" onClick={() => exportExcel()} >
                            <FiDownload size={14}/> Export Excel 
                        </button>
                        <button className="btn btn-success" onClick={handleSaveInit} style={{ padding: "12px 30px", fontSize: "16px", fontWeight: "bold" }}>
                            <FiSave size={16}/> Confirm & Log BOM Receipt
                        </button>
                    </div>
                    
                </div>
            )}

            {showUnmappedModal && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ maxWidth: '850px', width: '90%' }}>
                        <h3 style={{ color: 'var(--brand-danger)', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiAlertCircle /> Unmapped Components Detected
                        </h3>
                        <p style={{ marginBottom: '20px' }}>
                            We noticed items from the OCR scan that do not exist in your Product Master. 
                            Would you like to register them into the system now, or proceed with saving the GRN anyway?
                        </p>
                        
                        <div style={{ maxHeight: '50vh', overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
                            {unmappedDrafts.map((draft, idx) => (
                                <div key={idx} style={{ padding: '15px', border: '1px solid var(--border-light)', marginBottom: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)' }}>
                                    <div className="form-grid-layout" style={{ gridTemplateColumns: '1fr 2fr 1fr' }}>
                                        <div>
                                            <label className="input-label">Internal Item Code</label>
                                            <input className="form-input" value={draft.item_code} onChange={e => handleDraftChange(idx, 'item_code', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="input-label">Item Name / Description</label>
                                            <input className="form-input" value={draft.item_name} onChange={e => handleDraftChange(idx, 'item_name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="input-label">Inventory Group</label>
                                            <input 
                                                list="inventory-groups-list"
                                                className="form-input" 
                                                value={draft.item_group} 
                                                onChange={e => handleDraftChange(idx, 'item_group', e.target.value)}
                                                placeholder="Select or type new..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <datalist id="inventory-groups-list">
                            <option value="Raw Material" />
                            <option value="Consumable" />
                            <option value="Sub-Assembly" />
                        </datalist>

                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowUnmappedModal(false)}>Cancel & Review Table</button>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn btn-secondary" onClick={handleProceedWithoutAdding}>Save GRN Without Registering</button>
                                <button className="btn btn-success" onClick={handleRegisterAndSave}>
                                    <FiSave /> Register Items & Save GRN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}