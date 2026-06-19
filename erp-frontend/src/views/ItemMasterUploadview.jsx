import { useState, useRef } from "react";
import API from "../api/api";

export default function ItemMasterUploadView({ state }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.csv')) {
            setSelectedFile(file);
        } else if (file) {
            if (state.setAlertMessage) {
                state.setAlertMessage("Invalid file type. Please upload a strictly formatted .csv file.");
                state.setIsAlertOpen(true);
            }
            setSelectedFile(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        try {
            const result = await API.uploadItemMasterCSV(selectedFile, state.user.access_token);
            
            if (state.setAlertMessage) {
                state.setAlertMessage(`✅ Success: ${result.message}`);
                state.setIsAlertOpen(true);
            }
            
            // Reset after successful upload
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            
            // Optionally refresh the global items master if you decide to point this at production later
            // if (state.refreshDataHub) state.refreshDataHub();

        } catch (err) {
            if (state.setAlertMessage) {
                state.setAlertMessage(`❌ Upload Failed: ${err.message}`);
                state.setIsAlertOpen(true);
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="frappe-card" style={{ maxWidth: 800, margin: "0 auto", padding: 30 }}>
            <div className="system-header">
                <h3>📥 Bulk Import: Product Master</h3>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Seed the testing database using vendor CSV files</p>
            </div>

            <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", padding: "20px", marginBottom: "30px" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "var(--brand-accent)" }}>Data Formatting Requirements</h4>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "15px", lineHeight: "1.5" }}>
                    To ensure the database ingests your records correctly, your CSV file must contain exactly these column headers in the first row. The system is case-sensitive.
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                    <span style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "6px 12px", borderRadius: "4px", fontSize: "13px", fontWeight: "bold", fontFamily: "monospace" }}>
                        Item code
                    </span>
                    <span style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "6px 12px", borderRadius: "4px", fontSize: "13px", fontWeight: "bold", fontFamily: "monospace" }}>
                        Item Specifications
                    </span>
                </div>
            </div>

            <div 
                style={{ 
                    border: "2px dashed var(--border-subtle)", 
                    borderRadius: "var(--radius-md)", 
                    padding: "40px 20px", 
                    textAlign: "center",
                    background: selectedFile ? "var(--combobox-hover)" : "var(--bg-surface)",
                    transition: "all 0.2s ease"
                }}
            >
                <input 
                    type="file" 
                    accept=".csv" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileSelect} 
                />
                
                <div style={{ fontSize: "40px", marginBottom: "15px" }}>📊</div>
                
                {selectedFile ? (
                    <div>
                        <h4 style={{ margin: "0 0 5px 0", color: "var(--text-main)" }}>{selectedFile.name}</h4>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 20px 0" }}>
                            {(selectedFile.size / 1024).toFixed(2)} KB ready for processing
                        </p>
                        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                            <button className="btn btn-secondary" onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value=""; }}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleUpload} disabled={isUploading}>
                                {isUploading ? "⏳ Uploading..." : "Commence Import"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h4 style={{ margin: "0 0 10px 0", color: "var(--text-main)" }}>Select a CSV file to upload</h4>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 20px 0" }}>
                            Maximum file size: 5MB
                        </p>
                        <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
                            Browse Local Files
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}