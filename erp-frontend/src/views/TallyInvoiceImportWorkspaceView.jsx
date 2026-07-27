import React, { useState } from "react";
import API from "../api/api";
import {
    FiUploadCloud,
    FiCheckCircle,
    FiTrash2,
    FiFileText,
    FiChevronDown,
    FiChevronRight
} from "react-icons/fi";

export default function TallyInvoiceImportWorkspaceView({ state }) {

    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [stagedBills, setStagedBills] = useState([]);
    const [isCommitting, setIsCommitting] = useState(false);

    const [expandedBill, setExpandedBill] = useState(null);

    async function handleFileUpload(e) {
        e.preventDefault();

        if (!file) return;

        setIsUploading(true);

        try {

            const response =
                await API.uploadTallyInvoiceJSON(file, state.user.access_token);

            setStagedBills(response.extracted_bills || []);

            state.setAlertMessage(`Loaded ${response.extracted_bills?.length || 0} invoices.`);
            state.setIsAlertOpen(true);

        }
        catch (err) {
            state.showErrorModal("Invoice Import", err.message);
        }
        finally {
            setIsUploading(false);
        }
    }

    function updateBill(billIndex, field, value) {

        setStagedBills(prev => {

            const copy = [...prev];

            copy[billIndex] = {
                ...copy[billIndex],
                [field]: value
            };

            return copy;
        });

    }

    function removeBill(index) {
        setStagedBills(prev => prev.filter((_, i) => i !== index));
    }

    function updateItem(indexBill, indexItem, field, value) {

        setStagedBills(prev => {

            const copy = [...prev];

            copy[indexBill].items[indexItem][field] = value;

            return copy;
        });

    }

    async function commitBills() {

        if (!window.confirm(`Commit ${stagedBills.length} invoices?`))
            return;

        setIsCommitting(true);

        let success = 0;
        let failed = 0;

        for (const bill of stagedBills) {

            try {

                await API.saveBill(bill, state.user.access_token);

                success++;

            }
            catch {
                failed++;
            }

        }

        setIsCommitting(false);

        state.showErrorModal("Invoice Migration", `Inserted ${success}. Failed ${failed}.`);

        setStagedBills([]);
        setFile(null);
    }

    return (

        <div className="frappe-card"
            style={{ maxWidth: 1300, margin: "0 auto", padding: 25 }}>

            <div className="system-header">

                <h2 style={{ display: "flex", gap: 10 }}>
                    <FiFileText />
                    Tally Invoice Migration
                </h2>

                <p>
                    Review invoices before committing them into ERP.
                </p>

            </div>

            <form onSubmit={handleFileUpload} 
                style={{ display: "flex", gap: 15, margin: "20px 0" }}>

                <input type="file" accept=".json" className="form-input" style={{ flex: 1 }} onChange={e => setFile(e.target.files[0])}/>

                <button className="btn btn-primary" disabled={!file || isUploading}>

                    <FiUploadCloud />

                    {" "}

                    {isUploading ? "Parsing..." : "Extract"}

                </button>

            </form>

            {stagedBills.length > 0 && (

                <>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20}}>

                        <h4>
                            {stagedBills.length} Buffered Invoices
                        </h4>

                        <button className="btn btn-success" onClick={commitBills} disabled={isCommitting}>

                            <FiCheckCircle />

                            {" "}

                            {isCommitting ? "Writing..." : "Commit All"}

                        </button>

                    </div>

                    {stagedBills.map((bill, billIndex) => (

                        <div key={bill.bill_num} className="frappe-card" style={{ marginBottom: 15 }}>

                            <div style={{ display: "flex", alignItems: "center", cursor: "pointer", padding: 12}}

                                onClick={() => setExpandedBill(expandedBill === billIndex ? null : billIndex)}>

                                {expandedBill === billIndex ? <FiChevronDown /> : <FiChevronRight />}

                                <div style={{ flex: 1, marginLeft: 10}}>

                                    <b>{bill.bill_num}</b>

                                    {" • "}

                                    {bill.bill_date}

                                    {" • "}

                                    {bill.party_name}

                                    {" • "}

                                    {bill.items.length} items

                                </div>

                                <button className="btn-text-danger" onClick={(e) => { e.stopPropagation(); removeBill(billIndex);}}>

                                    <FiTrash2 />

                                </button>

                            </div>

                            {expandedBill === billIndex && (

                                <table style={{ width: "100%", borderCollapse: "collapse"}}>

                                    <thead>

                                        <tr>

                                            <th>Product</th>

                                            <th>Item Code</th>
                                            <th>State</th>
                                            <th>Qty</th>

                                            <th>Rate</th>

                                            <th>Amount</th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {bill.items.map((item, itemIndex) => (

                                            <tr key={itemIndex}>

                                                <td>

                                                    <input className="form-input" value={item.product_name || ""} onChange={(e) => updateItem(billIndex, itemIndex, "product_name", e.target.value) }/>

                                                </td>

                                                <td>

                                                    <select className="form-input" value={item.item_code || ""} onChange={(e)=>updateItem(billIndex, itemIndex, "item_code", e.target.value)}>
                                                        <option value="">Select Item</option>
                                                        {state.itemsMaster.map(item=>(
                                                            <option key={item.item_code} value={item.item_code}>{item.item_code}</option>
                                                        ))}
                                                    </select>

                                                </td>
                                                <td>
                                                    <select className="form-input" value={bill.indian_state || ""} onChange={(e)=>updateBill(billIndex, "indian_state", e.target.value)}>
                                                        <option value="">Select state</option>
                                                        {state.indiaMap.features.map(feature=><option key={feature.properties.ST_NM} value={feature.properties.ST_NM}>{feature.properties.ST_NM}</option>)}
                                                    </select>
                                                </td>
                                                <td>{item.quantity_shipped}</td>

                                                <td>{item.rate}</td>

                                                <td>{item.amount}</td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            )}

                        </div>

                    ))}

                </>

            )}

        </div>

    );

}