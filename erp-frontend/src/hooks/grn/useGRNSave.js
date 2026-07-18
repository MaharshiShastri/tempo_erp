import API from "../../api/api";

export default function useGRNSave({scannedData, setScannedData, unmappedDrafts, setUnmappedDrafts, setShowUnmappedModal, sessionToken, setAlertMessage, setIsAlertOpen}){
    const exportExcel = async () => {
        const blob = await API.exportGRNPreview(scannedData, sessionToken);
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
                item_name: item.item_name || item.description || 'Unknown Component',
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
            const response = await API.saveGRN(payloadToSave, sessionToken);
            const grnId = response.grn_id || response.id;
            
            const baseUrl = window.location.origin;
            window.open(`${baseUrl}/api/v1/wms/grn/export/${grnId}`, "_blank");
            
            if (setAlertMessage) {
                setAlertMessage("✅ GRN Saved Successfully!");
                setIsAlertOpen(true);
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
                await API.saveItemMaster(draft, sessionToken);
            }
                
            const newItems = [...scannedData.items];
            unmappedDrafts.forEach(draft => {
                newItems[draft.originalIndex].item_code = draft.item_code;
                newItems[draft.originalIndex].isMatched = true;
                newItems[draft.originalIndex].item_name = draft.item_name;
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
    
    return{exportExcel, handleSaveInit, executeSaveGRN, handleRegisterAndSave, handleProceedWithoutAdding};

}