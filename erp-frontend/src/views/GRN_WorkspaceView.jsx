import { useState, useRef, useEffect } from "react";
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
            state.setAlertMessage("🤖 AI Vision analyzing invoice structure... Please wait.");
            state.setIsAlertOpen(true);
        }

        try {
            const result = await API.scanVendorBill(file, state.user.access_token);
            
            const editableItems = await Promise.all(
    result.data.items.map(async (aiItem) => {

        let matchedSpec = "";

        try {
            if (aiItem.item_code) {

                const lookup = await API.getTestItem(aiItem.item_code, state.user.access_token);

                if (lookup) {
                    matchedSpec = lookup.item_specification || "";
                }
            }
        } catch(error) {
            alert("An error occurred: " + error.message);
        }

        return {
            ...aiItem,
            test_specification: matchedSpec,
            isMatched: !!matchedSpec,
            amount:
                Number(
                    (
                        (parseFloat(aiItem.quantity) || 0) *
                        (parseFloat(aiItem.rate) || 0)
                    ).toFixed(2)
                )
        };
    })
);

            const totals = calculateTotals(editableItems);

            setScannedData({
                vendor_name: result.data.vendor_name || "",
                invoice_number: result.data.invoice_number || "",
                grn_number: `GRN-${Date.now().toString().slice(-4)}`,
                items: editableItems,
                taxes: {
                    cgst: totals.cgst,
                    sgst: totals.sgst
                },
                subtotal: totals.subtotal,
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

    const calculateTotals = (items) => {
        const subtotal = items.reduce(
            (sum, item) => sum + (Number(item.amount) || 0),
            0
        );

        const cgst = +(subtotal * 0.09).toFixed(2);
        const sgst = +(subtotal * 0.09).toFixed(2);

        return {
            subtotal,
            cgst,
            sgst,
            grand_total: +(subtotal + cgst + sgst).toFixed(0)
        };
    };
    
    const updateHeader = (field, value) => {
        setScannedData({ ...scannedData, [field]: value });
    };

    const updateItem = async (index, field, value) => {
        const newItems = [...scannedData.items];
        newItems[index][field] = value;
        
        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = (parseFloat(newItems[index].quantity) || 0) * (parseFloat(newItems[index].rate) || 0);
        }

        if (field === 'item_code') {
            try {
                const lookup = API.getTestItem(value, state.user.access_token);

                if (lookup) {

                    newItems[index].isMatched = true;

                    newItems[index].test_specification = lookup.item_specification || "";

                } else {

                    newItems[index].isMatched = false;
                    newItems[index].test_specification = "";
                }

            } catch {

                newItems[index].isMatched = false;
                newItems[index].test_specification = "";
            }
        }

        const totals = calculateTotals(newItems);

        setScannedData({
            ...scannedData,
            items: newItems,
            subtotal: totals.subtotal,
            taxes: {
                cgst: totals.cgst,
                sgst: totals.sgst
            },
            grand_total: totals.grand_total
        });
    };

    const exportExcel = async () => {
        const totals = calculateTotals(scannedData.items);

        const payload = {
            ...scannedData,
            subtotal: totals.subtotal,
            taxes: {
                cgst: totals.cgst,
                sgst: totals.sgst
            },
            grand_total: totals.grand_total
        };

        const blob = await API.exportGRNPreview(payload, state.user.access_token);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${scannedData.grn_number}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };

    useEffect(() => {
        if (!scannedData) return;

        const totals = calculateTotals(scannedData.items);

        setScannedData(prev => ({
            ...prev,
            subtotal: totals.subtotal,
            taxes: {
                cgst: totals.cgst,
                sgst: totals.sgst
            },
            grand_total: totals.grand_total
        }));
    }, [scannedData?.items]);
    // --- Save Interception Logic ---
    const handleSaveInit = () => {
        const unmatched = scannedData.items.filter(i => !i.isMatched);
        
        if (unmatched.length > 0) {
            const drafts = unmatched.map(item => ({
                originalIndex: scannedData.items.indexOf(item),
                item_code: item.item_code || `NEW-${Date.now().toString().slice(-4)}`,
                item_name: item.description || 'Unknown Component',
                item_group: 'Raw Material', // Default, but now editable via text
                rate: item.rate || 0,
                unit_measure: 'NOS',
                additional_spec_text: item.description || '',
                hsn_code: '',
                revision_no: '0'
            }));
            
            setUnmappedDrafts(drafts || []);
            setShowUnmappedModal(true);
            return;
        }

        executeSaveGRN(scannedData);
    };

    const executeSaveGRN = async (payloadToSave) => {
        try {
            const response = await API.saveGRN(payloadToSave, state.user.access_token);
            const grnId = response.grn_id;
            
            const baseUrl = window.location.origin;
            window.open(`${baseUrl}/api/v1/wms/grn/export/${grnId}`, "_blank");
            
            alert("GRN Saved Successfully!");
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
        setUnmappedDrafts(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
    };

    return (
        <div className="frappe-card" style={{ maxWidth: 1200, margin: "0 auto", padding: 25 }}>
            <div className="system-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h3>📦 Goods Receipt Note (GRN) Desk</h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Vendor Invoice to BOM Auto-Mapper</p>
                </div>
                <div>
                    <input type="file" accept="image/jpeg, image/png, application/pdf" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                    <button className="btn btn-secondary" style={{ background: "var(--brand-accent)", color: "#fff", border: "none" }} onClick={() => fileInputRef.current.click()} disabled={isScanning}>
                        {isScanning ? "⏳ Processing OCR..." : "📸 Scan Vendor Invoice"}
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

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ background: "var(--bg-surface)", textAlign: "left", borderBottom: "2px solid var(--border-light)" }}>
                                    <th style={{ padding: "12px", width: "25%" }}>Internal Item Code *</th>
                                    <th style={{ padding: "12px", width: "40%" }}>Vendor Description (OCR)</th>
                                    <th style={{ padding: "12px", width: "10%" }}>Qty</th>
                                    <th style={{ padding: "12px", width: "10%" }}>Rate</th>
                                    <th style={{ padding: "12px", width: "15%" }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scannedData.items.map((item, idx) => (
                                    <tr key={idx} style={{ 
                                        borderBottom: "1px solid var(--border-light)",
                                        background: item.isMatched ? "transparent" : "var(--warning-row)" 
                                    }}>
                                        <td style={{ padding: "12px" }}>
                                            <input 
                                                list="master-items-list"
                                                className="form-input" 
                                                style={{ border: item.isMatched ? "1px solid var(--border-subtle)" : "1px solid var(--brand-danger)" }}
                                                value={item.item_code} 
                                                onChange={(e) => updateItem(idx, "item_code", e.target.value)}
                                                placeholder="Search Code..."
                                            />
                                            {!item.isMatched && <div style={{ fontSize: "10px", color: "var(--brand-danger)", marginTop: "4px", fontWeight: "bold" }}>⚠️ Unmapped Code</div>}
                                            {item.test_specification && (<div style={{ marginTop: "4px", fontSize: "11px", color: "#666"}}> {item.test_specification} </div> )}
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            <input className="form-input" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} />
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            <input type="number" className="form-input" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            <input type="number" step="0.01" className="form-input" value={item.rate} onChange={(e) => updateItem(idx, "rate", e.target.value)} />
                                        </td>
                                        <td className="grn-amount-cell" style={{ padding:"12px" }}>
                                            ₹{item.amount.toFixed(2)}
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
                        <div style={{ width: "300px", padding: "15px", background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                <span>SGST:</span>
                                <strong>₹{scannedData.taxes.sgst}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
                                <span>CGST:</span>
                                <strong>₹{scannedData.taxes.cgst}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", color: "var(--brand-accent)" }}>
                                <strong>Grand Total:</strong>
                                <strong>₹{scannedData.grand_total}</strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", gap: "10px" }}>
                        <button className="btn btn-secondary" onClick={() => exportExcel()} >
                            📊 Export Excel 
                        </button>
                        <button className="btn btn-success" onClick={handleSaveInit} style={{ padding: "12px 30px", fontSize: "16px", fontWeight: "bold" }}>
                            Confirm & Log BOM Receipt
                        </button>
                    </div>
                    
                </div>
            )}

            {/* Unmapped Items Registration Modal */}
            {showUnmappedModal && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ maxWidth: '850px', width: '90%' }}>
                        <h3 style={{ color: 'var(--brand-danger)', margin: '0 0 10px 0' }}>⚠️ Unmapped Components Detected</h3>
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
                                            <input
                                                className="form-input"
                                                value={draft.item_code ?? ""}
                                                onChange={e => handleDraftChange(idx, 'item_code', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="input-label">Item Name / Description</label>
                                            <input
                                                className="form-input"
                                                value={draft.item_name ?? ""}
                                                onChange={e => handleDraftChange(idx, 'item_name', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="input-label">Inventory Group</label>
                                            <input
                                                list="inventory-groups-list"
                                                className="form-input"
                                                value={draft.item_group ?? ""}
                                                onChange={e => handleDraftChange(idx, 'item_group', e.target.value)}
                                                placeholder="Select or type new..."
                                            />
                                        </div>
                                    </div>

                                    {/* ✅ SPEC FIELD (fixed placement inside map) */}
                                    <div style={{ marginTop: 10 }}>
                                        <label className="input-label">
                                            Item Specification (Technical / Vendor Detail)
                                        </label>
                                        <textarea
                                            className="form-input"
                                            rows={2}
                                            value={draft.additional_spec_text ?? ""}
                                            onChange={e =>
                                                handleDraftChange(idx, 'additional_spec_text', e.target.value)
                                            }
                                            placeholder="e.g. Copper winding, 230V rated, ISI certified..."
                                        />
                                    </div>

                                </div>
                            ))}
                        </div>

                        {/* Dropdown suggestions for the hybrid text field */}
                        <datalist id="inventory-groups-list">
                            <option value="Raw Material" />
                            <option value="Consumable" />
                            <option value="Sub-Assembly" />
                        </datalist>
                        <div style={{ gridColumn: '1 / span 3' }}>
                            <label className="input-label">
                                Item Specifications (Technical / Vendor Detail)
                            </label>
                            <textarea
                                className="form-input"
                                rows={2}
                                value={draft.additional_spec_text ?? ""}
                                onChange={e =>
                                    handleDraftChange(idx, 'additional_spec_text', e.target.value)
                                }
                                placeholder="e.g. Copper winding, 230V rated, ISI certified..."
                            />
                        </div>
                        
                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowUnmappedModal(false)}>Cancel & Review Table</button>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn btn-secondary" onClick={handleProceedWithoutAdding}>Save GRN Without Registering</button>
                                <button className="btn btn-success" onClick={handleRegisterAndSave}>Register Items & Save GRN</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}