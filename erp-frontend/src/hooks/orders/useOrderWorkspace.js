import { useState, useEffect } from "react";

export default function useOrderWorkspace({sessionToken, companiesMaster, itemsMaster, setAlertMessage, setIsAlertOpen, setActiveTab}){
    const defaultOrderItem = { item_code: '', additional_spec_text: '', hsn_code: '', quantity: 1, unit_measure: 'NOS', rate: 0.00, discount_percentage: 0.00 };
    const defaultOrderHeader = { order_acceptance_id: '', order_acceptance_date: '', purchase_order_number: '', purchase_order_date: '', customer_code: '', payment_terms: '', billing_name: '', billing_address: '', due_date: '' };
    
    const [orders, setOrders] = useState([]);
    const [orderHeader, setOrderHeader] = useState({...defaultOrderHeader});
    const [orderItems, setOrderItems] = useState([{ ...defaultOrderItem }]);
    const [billItems, setBillItems] = useState([]);
    const [isBillingSameAsCustomer, setIsBillingSameAsCustomer] = useState(true);

    const appendOrderItemRow = () => setOrderItems([...orderItems, { ...defaultOrderItem }]);
    const popOrderItemRow = (idx) => setOrderItems(orderItems.filter((_, i) => i !== idx));
    const updateOrderItemField = (idx, field, val) => {const items = [...orderItems]; items[idx][field] = val; setOrderItems(items);};

    const handleCustomerMasterSelection = (custCode) => {
        if (custCode === "TRIGGER_ERR_UNAUTHORIZED_CLIENT" || (custCode && !companiesMaster.find(c => c.id === custCode))) {
            setAlertMessage("The chosen corporate entity does not exist within the customer master data tables.");
            setIsAlertOpen(true);
            setOrderHeader({ ...orderHeader, customer_code: '', billing_name: '', billing_address: '' });
            return;
        }
        const matched = companiesMaster.find(c => c.id === custCode);
        if (matched) setOrderHeader({ ...orderHeader, customer_code: custCode, billing_name: isBillingSameAsCustomer ? matched.name : '', billing_address: isBillingSameAsCustomer ? matched.address : '' });
        else setOrderHeader({ ...orderHeader, customer_code: '', billing_name: '', billing_address: '' });
    };

    
    const handleItemMasterSelection = (index, itemCode) => {
        if (itemCode === "TRIGGER_ERR_UNREGISTERED_PART" || (itemCode && !itemsMaster.find(i => i.item_code === itemCode))) {
            setAlertMessage("Item missing from master logs."); setIsAlertOpen(true); updateOrderItemField(index, 'item_code', ''); return;
        }
        const matched = itemsMaster.find(i => i.item_code === itemCode);
        if (matched) {
            const items = [...orderItems];
            items[index] = { ...items[index], item_code: itemCode, additional_spec_text: matched.additional_spec_text || '', hsn_code: matched.hsn_code || '', rate: matched.rate || 0.00, unit_measure: matched.unit_measure || 'NOS', discount_percentage: 0.00 };
            setOrderItems(items);
        }
    };
    
    useEffect(() => {
        if (!orderHeader.customer_code) return;
        const matched = companiesMaster.find(c => c.id === orderHeader.customer_code);
        if (!matched) return;
        
        if (isBillingSameAsCustomer) {setOrderHeader(prev => ({...prev, billing_name: matched.name, billing_address: matched.address}));} 
        
        else {
            setOrderHeader(prev => ({...prev, billing_name: prev.billing_name === matched.name? "" : prev.billing_name,
                billing_address: prev.billing_address === matched.address ? "": prev.billing_address}));
        }
    }, [isBillingSameAsCustomer, orderHeader.customer_code, companiesMaster]);

    return{defaultOrderHeader, defaultOrderItem, orders, setOrders, orderHeader, setOrderHeader, orderItems, setOrderItems, billItems, setBillItems, isBillingSameAsCustomer, setIsBillingSameAsCustomer, appendOrderItemRow, popOrderItemRow, updateOrderItemField, handleCustomerMasterSelection, handleItemMasterSelection};
    
}