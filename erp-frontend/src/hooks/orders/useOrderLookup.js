import { useState, useEffect, useRef } from "react";
import API from "../../api/api";

export default function useOrderLookup({sessionToken, companiesMaster, itemsMaster, setAlertMessage, setIsAlertOpen, setActiveTab,
    orders, setOrders, orderHeader, setOrderHeader, orderItems, setOrderItems, billItems, setBillItems, isBillingSameAsCustomer, setIsBillingSameAsCustomer,
    appendOrderItemRow, popOrderItemRow, updateOrderItemField, handleCustomerMasterSelection, handleItemMasterSelection, showErrorModal,
    isPendingTallyOrder, setIsPendingTallyOrder, productionScheduleForm, setProductionScheduleForm,
}){
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    
    const [oaSuggestions, setOaSuggestions] = useState([]);
    const [showOaSuggestions, setShowOaSuggestions] = useState(false);
    const oaInputRef = useRef(null);
    
    const [isNewClient, setIsNewClient] = useState(false);
    const [temporaryClientName, setTemporaryClientName] = useState("");
    
    const [productionScheduleOaSuggestions, setProductionScheduleOaSuggestions] = useState([]);
    const [showProductionScheduleOaSuggestions, setShowProductionScheduleOaSuggestions] = useState(false);
    const productionScheduleOaInputRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (oaInputRef.current && !oaInputRef.current.contains(event.target)) {setShowOaSuggestions(false);}
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOaInputChange = async (e) => {
        const query = e.target.value.toUpperCase();
        setOrderHeader(prev=>({...prev, order_acceptance_id: query}));
        
        if (query.length >= 2) {
            try {
                const data = await API.searchOAAutocomplete(query, sessionToken);
                const sortedData = [...data].sort((a, b) => {
                        const aId = String(a?.order_acceptance_id || "");
                        const bId = String(b?.order_acceptance_id || "");

                        const aLower = aId.toLowerCase();
                        const bLower = bId.toLowerCase();

                        const aIncludes = aLower.includes(query.toLowerCase());
                        const bIncludes = bLower.includes(query.toLowerCase());

                        if (aIncludes && !bIncludes) return -1;
                        if (!aIncludes && bIncludes) return 1;

                        return aLower.localeCompare(bLower);
                    });
                
                setOaSuggestions(sortedData);
                setShowOaSuggestions(true);
            } catch (err) {
                console.error("OA Autocomplete error:", err);
            }
        } else {
            setOaSuggestions([]);
            setShowOaSuggestions(false);
        }
    };
    
    const handleOaSelect = (selectedOa) => {
        setOrderHeader({...orderHeader, order_acceptance_id: selectedOa});
        setShowOaSuggestions(false);
        handleOaSearch(selectedOa);
    };

    const handleProductionScheduleOaInputChange = async (e) => {
        const query = e.target.value.toUpperCase();

        setProductionScheduleForm((prev) => ({
            ...(prev || {}),
            order_acceptance_id: query,
        }));

        if (query.length < 2) {
            setOaSuggestions([]);
            setShowOaSuggestions(false);
            return;
        }

        try {
            const data = await API.searchOAAutocomplete(
                query,
                sessionToken
            );

            console.log("OA autocomplete response:", data);

            const suggestions = Array.isArray(data) ? data : [];

            const queryLower = query.toLowerCase();

            const sortedData = [...suggestions].sort((a, b) => {
                const aId = String(a?.order_acceptance_id || "");
                const bId = String(b?.order_acceptance_id || "");

                const aLower = aId.toLowerCase();
                const bLower = bId.toLowerCase();

                const aIncludes = aLower.includes(queryLower);
                const bIncludes = bLower.includes(queryLower);

                if (aIncludes && !bIncludes) return -1;
                if (!aIncludes && bIncludes) return 1;

                return aLower.localeCompare(bLower);
            });

            console.log("Sorted OA suggestions:", sortedData);

            setOaSuggestions(sortedData);
            setShowOaSuggestions(sortedData.length > 0);
        } catch (err) {
            console.error(
                "Production Schedule OA autocomplete error:",
                err
            );

            setOaSuggestions([]);
            setShowOaSuggestions(false);
        }
    };

    const handleProductionScheduleOaSelect = (selectedOa) => {
        setProductionScheduleForm((prev) => ({
            ...(prev || {}),
            order_acceptance_id: selectedOa,
        }));

        setShowOaSuggestions(false);

        handleOaSearch(selectedOa);
    };

    const handleOaSearch = async (exactOaId) => {
        if (!exactOaId) return;
        setShowOaSuggestions(false); 
        try {
            setAlertMessage("Searching pending Tally orders...");
            setIsAlertOpen(true);
            const safeId = encodeURIComponent(exactOaId);

            const r = await fetch(`/api/v1/orders/search/oa/${safeId}`, {
                headers: { "Authorization": `Bearer ${sessionToken}` }
            });
            
            if (!r.ok) throw new Error("Order Acceptance draft not found.");
            const data = await r.json();

            // Helper function to safely isolate YYYY-MM-DD for standard HTML5 date pickers
            const cleanDateString = (rawDate) => {
                if (!rawDate) return "";
                return rawDate.includes("T") ? rawDate.split("T")[0] : rawDate.substring(0, 10);
            };
            
            setIsPendingTallyOrder(true);

            // Map the API data parameters safely to your frontend input states
            setOrderHeader((prev) => ({
            ...prev,

            order_acceptance_id:data.order_acceptance_id || exactOaId,

            order_acceptance_date: cleanDateString(data.order_acceptance_date),

            purchase_order_number: data.purchase_order_number || "",

            purchase_order_date: cleanDateString(data.purchase_order_date),

            due_date: cleanDateString(data.due_date),

            payment_terms: data.payment_terms || "",

            billing_name: data.billing_name || "",

            billing_address: data.billing_address || "",

            dispatched_through: data.dispatched_through || "",

            delivery_terms: data.delivery_terms || "",

            packing_charges: data.packing_charges ?? 0,

            freight_charges: data.freight_charges ?? 0,

            tax_rate: data.tax_rate ?? 18,

            // Tally field
            customer_code: data.tally_customer_code || "",
        }));


            // Auto-check if the company exists
            if (data.billing_name) {
                try {
                    const compRes = await fetch(`/api/v1/orders/search/companies?q=${encodeURIComponent(data.billing_name)}`, {
                        headers: { "Authorization": `Bearer ${sessionToken}` }
                    });
                    if (compRes.ok) {
                        const companies = await compRes.json();
                        const exists = companies.some(c => c.name?.toLowerCase() === data.billing_name.toLowerCase());
                        
                        if (!exists) {
                            setIsNewClient(true);
                            setTemporaryClientName(data.billing_name);
                        }
                    }
                } catch (companySearchErr) {
                    console.error("Failed to check company existence:", companySearchErr);
                }
            }
            
            // Auto-populate line items
            if (Array.isArray(data.items) && data.items.length > 0) {
                const formattedItems = data.items.map(item => ({
                    item_code: item.item_code || "",
                    additional_spec_text: item.additional_spec_text || "",
                    hsn_code: item.hsn_code || "",
                    quantity: item.quantity || 0,
                    rate: item.rate || 0,
                    discount_percentage: item.discount_percentage || 0,
                    amount: item.amount || 0
                }));
                setOrderItems(formattedItems);
            }
            
            setAlertMessage("✅ Staged Order Acceptance data populated.");
        } catch (error) {
            showErrorModal("OA Lookup Failed", error.message);
        }
    };
    return {isOcrLoading, setIsOcrLoading, oaSuggestions, setOaSuggestions, showOaSuggestions, setShowOaSuggestions, oaInputRef,
        isNewClient, setIsNewClient, temporaryClientName, setTemporaryClientName, handleOaInputChange, handleOaSelect, handleOaSearch,
        handleProductionScheduleOaInputChange, handleProductionScheduleOaSelect,

    };
}