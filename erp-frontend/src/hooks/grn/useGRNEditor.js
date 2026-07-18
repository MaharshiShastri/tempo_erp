import { useState } from "react";
import API from "../../api/api";

export default function useGRNEditor({scannedData, setScannedData, sessionToken}){
    const [showUnmappedModal, setShowUnmappedModal] = useState(false);
    const [unmappedDrafts, setUnmappedDrafts] = useState([]);
    
    const calculateTotals = (items, currentShipping = 0) => {
        let gross_total = 0;
        let discount_total = 0;
        let subtotal = 0; 

        items.forEach(item => {
            const q = parseFloat(item.quantity) || 0;
            const r = parseFloat(item.rate) || 0;
            const dp = parseFloat(item.discount_percent) || 0;
            
            const gross = q * r;
            const discAmt = gross * (dp / 100);
            const net = gross - discAmt;

            item.gross_amount = gross;
            item.discount_amount = discAmt;
            item.net_amount = net;

            gross_total += gross;
            discount_total += discAmt;
            subtotal += net;
        });
        subtotal += Number(currentShipping);
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

    const verifyItemCode = async (index, code) => {
        const cleanCode = (code || "").toString().trim();
        
        if (!cleanCode) {
            updateItem(index, "isMatched", true); // Treat empty as "not an error yet"
            return;
        }

        try {
            const response = await fetch(`/api/v1/wms/test-item/${encodeURIComponent(cleanCode)}`, {
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            });
            
            const data = response.ok ? await response.json() : null;

            setScannedData(prev => {
                if (!prev) return prev;
                const newItems = [...prev.items];
                
                if (data && data.item_specification) {
                    newItems[index].isMatched = true;
                    newItems[index].item_description = data.item_specification;
                } else {
                    newItems[index].isMatched = false;
                    newItems[index].item_description = "";
                }
                
                return { ...prev, items: newItems };
            });

        } catch (err) {
            console.error("Lookup failed:", err);
            updateItem(index, "isMatched", false);
        }
    };

    
    const addNewRow = () => {
        const newItems = [...scannedData.items, { 
            item_code: "", item_name: "", description: "", quantity: 0, rate: 0, discount_percent: 0, 
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

    const handleDraftChange = (index, field, value) => {
        const newDrafts = [...unmappedDrafts];
        newDrafts[index][field] = value;
        setUnmappedDrafts(newDrafts);
    };
    
    return{showUnmappedModal, setShowUnmappedModal, unmappedDrafts, setUnmappedDrafts, calculateTotals, updateHeader,
        updateFinancials, updateItem, verifyItemCode, addNewRow, removeRow, handleDraftChange
    };

}