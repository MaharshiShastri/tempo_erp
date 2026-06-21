import { useState, useRef } from "react";
import { FiUploadCloud, FiPlus, FiTrash2, FiSave, FiDownload, FiAlertCircle, FiPackage } from "react-icons/fi";
import API from "../api/api";

export default function GRN_WorkspaceView({ state }) {
    const [scannedData, setScannedData] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    
    // Modal State for Unmapped Items
    const [showUnmappedModal, setShowUnmappedModal] = useState(false);
    const [unmappedDrafts, setUnmappedDrafts] = useState([]);
    
    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);
        if (state.setAlertMessage && state.setIsAlertOpen) {
            state.setAlertMessage("🤖 AI Vision analyzing invoice structure & charges... Please wait.");
            state.setIsAlertOpen(true);
        }

        try {
            const result = await API.scanVendorBill(file, state.user.access_token);
            
            // Map and calculate initial values from AI
            let initialItems = result.data.items.map(aiItem => {
                const masterMatch = state.itemsMaster.find(m => m.item_code === aiItem.item_code);
                
                const qty = parseFloat(aiItem.quantity) || 0;
                const rate = parseFloat(aiItem.rate) || 0;
                const discPct = parseFloat(aiItem.discount_percent || aiItem.discount || 0);

                const gross = qty * rate;
                const discAmt = gross * (discPct / 100);
                const net = gross - discAmt;

                return {
                    ...aiItem,
                    item_name: masterMatch?.item_name || aiItem.description || "",
                    description: masterMatch?.item_specification || "",
                    isMatched: !!masterMatch || (aiItem.item_code === "" || !aiItem.item_code),
                    quantity: qty,
                    rate: rate,
                    discount_percent: discPct,
                    gross_amount: gross,
                    discount_amount: discAmt,
                    net_amount: net
                };
            });

            const capturedShipping = Number(result.data.shipping_charges || result.data.shipping) || 0;
            const totals = calculateTotals(initialItems, capturedShipping);

            setScannedData({
                vendor_name: result.data.vendor_name || result.data.name || "",
                invoice_number: result.data.invoice_number || "",
                grn_number: `GRN-${Date.now().toString().slice(-4)}`,
                items: initialItems,
                shipping: capturedShipping,
                gross_total: totals.gross_total,
                discount_total: totals.discount_total,
                subtotal: totals.subtotal,
                taxes: {
                    cgst: totals.cgst,
                    sgst: totals.sgst
                },
                grand_total: totals.grand_total
            });      
        } catch (err) {
            if (state.setAlertMessage) {
                state.setAlertMessage("Extraction Failed: " + err.message);
                state.setIsAlertOpen(true);
            }
        } finally {
            setIsScanning(false);
            if(fileInputRef.current) fileInputRef.current.value = ""; 
        }
    };

    // Centralized Calculation Engine (Gross -> Disc % -> Disc Amt -> Net)
    const calculateTotals = (items, currentShipping = 0) => {
        let gross_total = 0;
        let discount_total = 0;
        let subtotal = 0; // Subtotal represents total Net Amount

        items.forEach(item => {
            const q = parseFloat(item.quantity) || 0;
            const r = parseFloat(item.rate) || 0;
            const dp = parseFloat(item.discount_percent) || 0;
            
            const gross = q * r;
            const discAmt = gross * (dp / 100);
            const net = gross - discAmt;

            // Update item row values
            item.gross_amount = gross;
            item.discount_amount = discAmt;
            item.net_amount = net;

            // Add to running totals
            gross_total += gross;
            discount_total += discAmt;
            subtotal += net;
        });
        subtotal = items_net_total + Number(currentShipping);
        const cgst = subtotal * 0.09;
        const sgst = subtotal * 0.09;
        const grand_total = subtotal + cgst + sgst;

        return { gross_total, discount_total, subtotal, cgst, sgst, grand_total };
    };
    
    const updateHeader = (field, value) => {
        setScannedData({ ...scannedData, [field]: value });
    };

    const updateFinancials = (field, value) => {
        const numValue = value === "" ? "" : Number(value);
        const newShipping = field === 'shipping' ? numValue : scannedData.shipping;
        
        const totals = calculateTotals(scannedData.items, newShipping);

        setScannedData({
            ...scannedData,
            [field]: value, 
            gross_total: totals.gross_total,
            discount_total: totals.discount_total,
            subtotal: totals.subtotal,
            taxes: { cgst: totals.cgst, sgst: totals.sgst },
            grand_total: totals.grand_total
        });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...scannedData.items];
        newItems[index][field] = value;
        
        if (field === 'item_code') {
            const masterMatch = state.itemsMaster.find(m => m.item_code === value);
            newItems[index].isMatched = !!masterMatch || value === "";
            if (masterMatch) {
                newItems[index].description = masterMatch.item_name;
            }
        }

        const totals = calculateTotals(newItems, scannedData.shipping);

        setScannedData({
            ...scannedData,
            items: newItems,
            gross_total: totals.gross_total,
            discount_total: totals.discount_total,
            subtotal: totals.subtotal,
            taxes: { cgst: totals.cgst, sgst: totals.sgst },
            grand_total: totals.grand_total
        });
    };

    const addNewRow = () => {
        const newItems = [...scannedData.items, { 
            item_code: "", description: "", quantity: 0, rate: 0, discount_percent: 0, 
            gross_amount: 0, discount_amount: 0, net_amount: 0, isMatched: true 
        }];
        const totals = calculateTotals(newItems, scannedData.shipping);
        
        setScannedData({
            ...scannedData,
            items: newItems,
            gross_total: totals.gross_total,
            discount_total: totals.discount_total,
            subtotal: totals.subtotal,
            taxes: { cgst: totals.cgst, sgst: totals.sgst },
            grand_total: totals.grand_total
        });
    };

    const removeRow = (indexToRemove) => {
        const newItems = scannedData.items.filter((_, idx) => idx !== indexToRemove);
        const totals = calculateTotals(newItems, scannedData.shipping);
        
        setScannedData({
            ...scannedData,
            items: newItems,
            gross_total: totals.gross_total,
            discount_total: totals.discount_total,
            subtotal: totals.subtotal,
            taxes: { cgst: totals.cgst, sgst: totals.sgst },
            grand_total: totals.grand_total
        });
    };

    const exportExcel = async () => {
        const blob = await API.exportGRNPreview(scannedData, state.user.access_token);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${scannedData.grn_number}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };

    const handleSaveInit = () => {
        const unmatched = scannedData.items.filter(i => !i.isMatched && i.item_code !== "");
        
        if (unmatched.length > 0) {
            const drafts = unmatched.map(item => ({
                originalIndex: scannedData.items.indexOf(item),
                item_code: item.item_code || `NEW-${Date.now().toString().slice(-4)}`,
                item_name: item.description || 'Unknown Component',
                item_group: 'Raw Material',
                rate: item.rate || 0,
                unit_measure: 'NOS',
                additional_spec_text: item.description || '',
                hsn_code: '',
                revision_no: '0'
            }));
            
            setUnmappedDrafts(drafts);
            setShowUnmappedModal(true);
            return;
        }
        executeSaveGRN(scannedData);
    };

    const executeSaveGRN = async (payloadToSave) => {
        try {
            const response = await API.saveGRN(payloadToSave, state.user.access_token);
            const grnId = response.grn_id || response.id;
            
            const baseUrl = window.location.origin;
            window.open(`${baseUrl}/api/v1/wms/grn/export/${grnId}`, "_blank");
            
            if (state.setAlertMessage) {
                state.setAlertMessage("✅ GRN Saved Successfully!");
                state.setIsAlertOpen(true);
            }
            setScannedData(null);
            setShowUnmappedModal(false);
        } catch (err) {
            alert("Failed to save GRN: " + err.message);
        }
    };

    const handleRegisterAndSave = async () => {
        try {
            for (let draft of unmappedDrafts) {
                await API.saveItemMaster(draft, state.user.access_token);
            }
            
            const newItems = [...scannedData.items];
            unmappedDrafts.forEach(draft => {
                newItems[draft.originalIndex].item_code = draft.item_code;
                newItems[draft.originalIndex].isMatched = true;
                newItems[draft.originalIndex].description = draft.item_name;
            });
            
            const payloadToSave = { ...scannedData, items: newItems };
            setScannedData(payloadToSave);
            
            await executeSaveGRN(payloadToSave);
        } catch (err) {
            alert("Failed to register items: " + err.message);
        }
    };

    const handleProceedWithoutAdding = () => {
        executeSaveGRN(scannedData);
    };

    const handleDraftChange = (index, field, value) => {
        const newDrafts = [...unmappedDrafts];
        newDrafts[index][field] = value;
        setUnmappedDrafts(newDrafts);
    };

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
                                                list="master-items-list"
                                                className="form-input" 
                                                style={{ border: item.isMatched ? "1px solid var(--border-subtle)" : "1px solid var(--brand-danger)" }}
                                                value={item.item_code} 
                                                onChange={(e) => updateItem(idx, "item_code", e.target.value)}
                                                placeholder="Code..."
                                            />
                                            {!item.isMatched && <div style={{ fontSize: "10px", color: "var(--brand-danger)", marginTop: "4px", fontWeight: "bold", display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FiAlertCircle /> Unmapped
                                            </div>}
                                        </td>
                                        <td style={{ padding: "10px" }}>
                                            <input className="form-input" value={item.item_name} onChange={(e) => updateItem(idx, "item_name", e.target.value)} />
                                        </td>
                                        <td style={{ padding: "10px" }}>
                                            <input type="number" className="form-input" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
                                        </td>
                                        <td style={{ padding: "10px" }}>
                                            <input type="number" step="0.01" className="form-input" value={item.rate} onChange={(e) => updateItem(idx, "rate", e.target.value)} />
                                        </td>
                                        
                                        {/* Read Only Gross */}
                                        <td style={{ padding: "10px", background: "var(--bg-main)", color: "var(--text-muted)", fontWeight: "500" }}>
                                            ₹{(item.gross_amount || 0).toFixed(2)}
                                        </td>

                                        <td style={{ padding: "10px" }}>
                                            <input type="number" step="0.01" className="form-input" value={item.discount_percent || 0} onChange={(e) => updateItem(idx, "discount_percent", e.target.value)} />
                                        </td>
                                        
                                        {/* Read Only Disc Amt */}
                                        <td style={{ padding: "10px", background: "var(--bg-main)", color: "var(--brand-danger)", fontWeight: "500" }}>
                                            ₹{(item.discount_amount || 0).toFixed(2)}
                                        </td>

                                        {/* Final Net Amount */}
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
                        
                        <datalist id="master-items-list">
                            {state.itemsMaster.map(m => (
                                <option key={m.item_code} value={m.item_code}>{m.item_name}</option>
                            ))}
                        </datalist>
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

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>Freight/Shipping (+):</span>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    style={{ width: "100px", padding: "4px 8px", textAlign: "right" }}
                                    value={scannedData.shipping} 
                                    onChange={(e) => updateFinancials("shipping", e.target.value)}
                                />
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