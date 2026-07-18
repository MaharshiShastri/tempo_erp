import { useState, useRef } from "react";
import API from "../../api/api";

export default function useGRNScanner({sessionToken, setAlertMessage, setIsAlertOpen}){
    const [scannedData, setScannedData] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);
        if (setAlertMessage && setIsAlertOpen) {
            setAlertMessage("🤖 AI Vision analyzing invoice structure & charges... Please wait.");
            setIsAlertOpen(true);
        }

        try {
            const result = await API.scanVendorBill(file, sessionToken);
            
            // Map and calculate initial values from AI
            let initialItems = result.data.items.map(aiItem => {
                const cleanAicode = (aiItem.item_code || "").toString().trim();
                
                // NATIVELY TRUST THE BACKEND'S DB LOOKUP
                const isMatched = aiItem.matched_from_master === true || cleanAicode === "";
                
                const qty = parseFloat(aiItem.quantity) || 0;
                const rate = parseFloat(aiItem.rate) || 0;
                const discPct = parseFloat(aiItem.discount_percent || aiItem.discount || 0);

                const gross = qty * rate;
                const discAmt = gross * (discPct / 100);
                const net = gross - discAmt;

                return {
                    ...aiItem,
                    item_code: cleanAicode,
                    item_name: aiItem.description|| aiItem.item_name || "",
                    item_description: aiItem.item_description,
                    description: isMatched ? aiItem.description : (aiItem.item_name || aiItem.description || ""),
                    isMatched,
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
                taxes: { cgst: totals.cgst, sgst: totals.sgst },
                grand_total: totals.grand_total
            });      
        } catch (err) {
            if (setAlertMessage) {
                setAlertMessage("Extraction Failed: " + err.message);
                setIsAlertOpen(true);
            }
        } finally {
            setIsScanning(false);
            if(fileInputRef.current) fileInputRef.current.value = ""; 
        }
    };
    return {scannedData, setScannedData, isScanning, setIsScanning, fileInputRef, handleFileUpload, };
}
