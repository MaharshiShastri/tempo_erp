import React, { useState } from "react";
import { FiDownloadCloud, FiDatabase, FiDownload, FiFilter, FiLayers } from "react-icons/fi";
import API from "../api/api";

export default function TallySyncView({ state }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResponse, setSyncResponse] = useState(null);
    const [displayMode, setDisplayMode] = useState("normalized"); // 'normalized' or 'raw'

    // Query Builder State
    const [query, setQuery] = useState({
        report_name: "Sales Order",
        from_date: "",
        to_date: "",
        ledger_name: ""
    });

    const reportOptions = [
        "Sales Order",
        "Day Book",
        "Trial Balance",
        "Stock Summary",
        "Profit & Loss",
        "Balance Sheet",
        "Ledger Vouchers",
        "List of Accounts"
    ];

    const handleTallySync = async (e) => {
        e.preventDefault();
        setIsSyncing(true);

        try {
            const response = await API.syncTallyData(query, state.user.access_token);
            setSyncResponse(response);

            if (state.setAlertMessage) {
                state.setAlertMessage(`✅ Fetched ${query.report_name} successfully`);
            }
        } catch (error) {
            console.error(error);
            if (state.showErrorModal) {
                state.showErrorModal("Tally Error", error.message);
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const downloadJSON = () => {
        if (!syncResponse) return;
        const dataToSave = syncResponse[displayMode] || syncResponse;
        const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tally-${query.report_name.toLowerCase().replace(/\s+/g, "-")}-${displayMode}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: 20 }}>
            <div style={{ borderBottom: "1px solid #ccc", paddingBottom: 10, marginBottom: 20 }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                    <FiDatabase /> Tally ERP 9 / Prime Query Builder
                </h2>
                <p style={{ color: "#666", fontSize: 14, margin: "5px 0 0 0" }}>
                    Extract reports dynamically to inspect payload schemas for DB ingestion.
                </p>
            </div>

            {/* Query Builder Form */}
            <form onSubmit={handleTallySync} style={{
                background: "#f8f9fa",
                padding: 15,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                marginBottom: 20,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 15,
                alignItems: "end"
            }}>
                <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 5 }}>
                        Report Type
                    </label>
                    <select 
                        value={query.report_name} 
                        onChange={e => setQuery({...query, report_name: e.target.value})}
                        style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #ccc" }}
                    >
                        {reportOptions.map(rep => (
                            <option key={rep} value={rep}>{rep}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 5 }}>
                        From Date
                    </label>
                    <input 
                        type="date" 
                        value={query.from_date}
                        onChange={e => setQuery({...query, from_date: e.target.value})}
                        style={{ width: "100%", padding: "7px", borderRadius: 4, border: "1px solid #ccc" }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 5 }}>
                        To Date
                    </label>
                    <input 
                        type="date" 
                        value={query.to_date}
                        onChange={e => setQuery({...query, to_date: e.target.value})}
                        style={{ width: "100%", padding: "7px", borderRadius: 4, border: "1px solid #ccc" }}
                    />
                </div>

                {query.report_name === "Ledger Vouchers" && (
                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 5 }}>
                            Ledger Name
                        </label>
                        <input 
                            type="text" 
                            placeholder="e.g. HDFC Bank"
                            value={query.ledger_name}
                            onChange={e => setQuery({...query, ledger_name: e.target.value})}
                            style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #ccc" }}
                        />
                    </div>
                )}

                <div>
                    <button type="submit" disabled={isSyncing} style={{
                        width: "100%",
                        padding: "9px 15px",
                        background: "#0066cc",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: isSyncing ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontWeight: "bold"
                    }}>
                        {isSyncing ? "Querying Tally..." : <><FiDownloadCloud /> Execute Query</>}
                    </button>
                </div>
            </form>

            {/* Results Actions Toolbar */}
            {syncResponse && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button 
                            type="button"
                            onClick={() => setDisplayMode("normalized")}
                            style={{
                                padding: "6px 12px",
                                borderRadius: 4,
                                border: "1px solid #ccc",
                                background: displayMode === "normalized" ? "#333" : "#fff",
                                color: displayMode === "normalized" ? "#fff" : "#333",
                                cursor: "pointer"
                            }}
                        >
                            AI Normalized JSON
                        </button>
                        <button 
                            type="button"
                            onClick={() => setDisplayMode("raw")}
                            style={{
                                padding: "6px 12px",
                                borderRadius: 4,
                                border: "1px solid #ccc",
                                background: displayMode === "raw" ? "#333" : "#fff",
                                color: displayMode === "raw" ? "#fff" : "#333",
                                cursor: "pointer"
                            }}
                        >
                            Raw XML Parser Output
                        </button>
                    </div>

                    <button
                        onClick={downloadJSON}
                        style={{
                            padding: "6px 15px",
                            background: "#28a745",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                        }}
                    >
                        <FiDownload /> Export ({displayMode.toUpperCase()})
                    </button>
                </div>
            )}

            {/* Output Display */}
            <pre style={{
                background: "#0f172a",
                color: "#38bdf8",
                padding: 15,
                borderRadius: 8,
                maxHeight: "65vh",
                overflow: "auto",
                whiteSpace: "pre-wrap",
                fontSize: 13,
                fontFamily: "monospace"
            }}>
                {syncResponse
                    ? JSON.stringify(syncResponse[displayMode], null, 2)
                    : "// Select a report and execute query to inspect payload schema..."}
            </pre>
        </div>
    );
}