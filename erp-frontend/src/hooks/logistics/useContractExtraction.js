import { useState, useRef } from "react";
export default function useContractExtraction({sessionToken, setModalAlert, showErrorModal, addToast, populateState, setSelectedPartnerId}){
    const [isExtracting, setIsExtracting] = useState(false);
    const fileInputRef = useRef(null);

    const handleLogisticsFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setIsExtracting(true);
        setModalAlert({ isOpen: true, title: "🤖 AI Document Analysis", message: "Extracting contract parameters... This will take a moment.", isError: false });

        try {
            const response = await fetch("/api/v1/dispatch/partners/extract-from-file", {
                method: "POST",
                headers: { "Authorization": `Bearer ${sessionToken}` },
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Extraction failed");
            }

            const result = await response.json();
                
            setSelectedPartnerId(""); 
            populateState(result.data);
                
            setModalAlert({ isOpen: true, title: "Extraction Complete", message: "Please review the auto-filled data below before saving to the database.", isError: false });
        } catch (err) {
            setModalAlert({ isOpen: true, title: "AI Extraction Failed", message: err.message, isError: true });
        } finally {
            setIsExtracting(false);
            if(fileInputRef.current) fileInputRef.current.value = ""; 
        }
    };
    return {isExtracting, fileInputRef, handleLogisticsFileUpload};
}