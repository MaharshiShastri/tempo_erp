import { useState } from "react";
import API from "../../api/api";

export default function useOrders({sessionToken, companiesMaster, itemsMaster, setAlertMessage, setIsAlertOpen, setActiveTab}){
    const defaultOrderItem = { item_code: '', additional_spec_text: '', hsn_code: '', quantity: 1, unit_measure: 'NOS', rate: 0.00, discount_percentage: 0.00 };
    const defaultOrderHeader = { order_acceptance_id: '', order_acceptance_date: '', purchase_order_number: '', purchase_order_date: '', customer_code: '', payment_terms: '', billing_name: '', billing_address: '', due_date: '' };
    
    const [orders, setOrders] = useState([]);
    const [orderHeader, setOrderHeader] = useState([{...defaultOrderHeader}]);
    const [orderItems, setOrderItems] = useState([{ ...defaultOrderItem }]);
    const [billItems, setBillItems] = useState([]);
    const [isBillingSameAsCustomer, setIsBillingSameAsCustomer] = useState(true);

    const loadOrders = async () =>{
        try{
        
            const ord = await API.fetchOrders(sessionToken);
            if (!ord){setAlertMessage("Failed to load orders from DB"); setIsAlertOpen(true);}
            else setOrders(Array.isArray(ord) ? ord : []);
            console.log("The order fetched from backend: ", orders);
        }catch(err){
            setAlertMessage("Error occured while loading items: ", err.message);
            setIsAlertOpen(true);
        }
    };
    
    const commitOrderSubmit = async (passedHeader, passedItems) => {

        // 2. Validate using the passed payload, or fallback to state if needed
        const headerToSubmit = passedHeader || orderHeader;
        const itemsToSubmit = passedItems || orderItems;

        if (!headerToSubmit.customer_code || !headerToSubmit.billing_name.trim() || !headerToSubmit.billing_address.trim()) {
            setAlertMessage("Customer Code, Billing Name, and Address are strictly required."); 
            setIsAlertOpen(true); 
            return;
        }

        try {
            const payloadItems = itemsToSubmit.map(item => ({ 
                ...item, 
                amount: Math.round(((item.quantity || 0) * (item.rate || 0) * (1.0 - ((item.discount_percentage || 0) / 100.0))) * 100) / 100 
            }));

            const savedData = await API.saveOrder({ ...headerToSubmit, items: payloadItems }, sessionToken);
            
            setAlertMessage("Order successfully shared to factory.");
            /*executePrintWorkflow(savedData, 'order');*/
            setOrderHeader({ ...defaultOrderHeader }); 
            setOrderItems([{ ...defaultOrderItem }]); 
            refreshDashboard();
            
            await refreshDataHub(); 
            setActiveTab('orders-list');
        } catch (err) { 
            alert(err.message); 
        }
    };
    
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

    return{orders, loadOrders, commitOrderSubmit, appendOrderItemRow, popOrderItemRow, updateOrderItemField, handleCustomerMasterSelection,
        handleItemMasterSelection, isBillingSameAsCustomer, setIsBillingSameAsCustomer,};
}
