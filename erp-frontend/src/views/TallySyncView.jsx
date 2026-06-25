import React, { useState } from "react";
import { FiDownloadCloud, FiDatabase, FiDownload } from "react-icons/fi";
import API from "../api/api";

export default function TallySyncView({ state }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncData, setSyncData] = useState(null);
    const [mode, setMode] = useState("raw");
    const handleTallySync = async () => {
        setIsSyncing(true);

        try {
            const response = await API.syncTallyData(
                "company_list",
                state.user.access_token
            );
            
            setSyncData(response.normalized); // ✅ store object
            //setSyncData(response[mode]);

            if (state.setAlertMessage) {
                state.setAlertMessage("✅ Data fetched successfully");
            }

        } catch (error) {
            console.error(error);
        } finally {
            setIsSyncing(false);
        }
    };

    // ✅ Download JSON file
    const downloadJSON = () => {
        const blob = new Blob(
            [JSON.stringify(syncData, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tally-data.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: 20 }}>

            <h2 style={{ display: "flex", gap: 8 }}>
                <FiDatabase /> Tally Data
            </h2>

            <button onClick={handleTallySync} disabled={isSyncing}>
                {isSyncing ? "Loading..." : <><FiDownloadCloud /> Fetch Data</>}
            </button>

            {/* ✅ Download Button */}
            {syncData && (
                <button
                    onClick={downloadJSON}
                    style={{ marginLeft: 10 }}
                >
                    <FiDownload /> Download JSON
                </button>
            )}

            {/* ✅ SAFE DISPLAY */}
            <pre style={{
                marginTop: 20,
                background: "#111",
                color: "#0f0",
                padding: 15,
                borderRadius: 8,
                whiteSpace: "pre-wrap"
            }}>
                {syncData
                    ? JSON.stringify(syncData, null, 2)
                    : "No data yet"}
            </pre>

        </div>
    );
}