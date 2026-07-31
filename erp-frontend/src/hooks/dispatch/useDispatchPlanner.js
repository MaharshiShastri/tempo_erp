import { useState, useEffect, useMemo, useCallback } from "react";
import API from "../../api/api";

export default function useDispatchPlanner({sessionToken, showErrorModal, addToast}) {
    
    const [products, setProducts] = useState([{ width: "", height: "", depth: ""}]);
    const [unit, setUnit] = useState("cm"); // Default unit as requested

    const [dim, setDim] = useState({weight: 0, invoice_value: 0, destination_city: "", diesel_price: 100, loading_type: "local", hub_loading_input: 0, delivery_type: "door", hamali_detail: "", hamali_cost: 0});

    const [resultsData, setResultsData] = useState(null);
    const [selectedTransport, setSelectedTransport] = useState(null);
    const [partnerDistances, setPartnerDistances] = useState({});
    const [modalAlert, setModalAlert] = useState({ isOpen: false, title: "", message: "", isError: false });
    
    useEffect(() => {
        if (!resultsData?.options?.length) return;
        const best = [...resultsData.options].sort((a, b) => a.dispatch_cost_gst - b.dispatch_cost_gst)[0];
        setSelectedTransport(best);
    }, [resultsData]);

    const updateProduct = (index, field, value) => {
        const updated = [...products];
        updated[index][field] = value;
        setProducts(updated);
    };
    
    const addProduct = () => {
        if (products.length < 5) {
            setProducts([...products, { width: "", height: "", depth: ""}]);
        }
    };

    
    const removeProduct = (index) => {
        if (products.length > 1) {
            setProducts(products.filter((_, i) => i !== index));
        }
    };

    const handleEvaluate = async (e) => {
        e.preventDefault();
            
        // 1. Math Magic: Aggregate volumes & weights securely
        let total_cubic_inches = 0;
    
        products.forEach(p => {
            let w = Number(p.width) || 0;
            let h = Number(p.height) || 0;
            let d = Number(p.depth) || 0;
    
            // Convert to inches ONLY if the user selected Centimeters
            if (unit === 'cm') {
                w /= 2.54;
                h /= 2.54;
                d /= 2.54;
            }
    
            total_cubic_inches += (w * h * d);
        });
    
        try {
            const finalDistances = dim.delivery_type === "godown" ? {} : partnerDistances;
                
            // 2. Transmit the payload using the 1x1xTotal trick to bypass backend rewrites!
            const payload = {
                ...dim,
                width: total_cubic_inches, // Aggregate Volume
                height: 1,                 // Constant
                depth: 1,                  // Constant
                partner_distances: finalDistances
            };
    
            const response = await API.evaluateDispatch(payload, sessionToken);
            setResultsData(response); 
        } catch (err) {
            setModalAlert({ isOpen: true, title: "Evaluation Failed", message: err.message, isError: true });
        }
    };
    
    const confirmTransport = async (provider) => {
        try {
            const response = await API.saveDispatchRecord(provider, sessionToken);
            setModalAlert({ isOpen: true, title: "Success", message: response.message || "Dispatch option saved successfully.", isError: false });
            setSelectedTransport(provider);
            setTimeout(() => window.print(), 800); 
        } catch (err) {
            setModalAlert({ isOpen: true, title: "System Halt", message: err.message, isError: true });
        }
    };
    
    return {
        products, unit, dim, resultsData, selectedTransport, partnerDistances, modalAlert, 
        setUnit, setDim, setSelectedTransport, setPartnerDistances, setModalAlert,
        updateProduct, addProduct, removeProduct, 
        handleEvaluate, confirmTransport 
    };

}