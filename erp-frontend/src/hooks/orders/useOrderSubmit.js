import API from "../../api/api";

export default function useOrderSubmit({user, sessionToken, orderHeader, setIsBillingSameAsCustomer, setOrderHeader, orderItems, setOrderItems, defaultOrderHeader,
    defaultOrderItem, setOrders, isNewClient, temporaryClientName, setCompanyForm, setIsEditingCompany, setAlertMessage,
    setIsAlertOpen, setActiveTab, showErrorModal, isPendingTallyOrder, setIsPendingTallyOrder}){
    
    const triggerNewOrderInitialization = () => {
        setIsBillingSameAsCustomer(true);
        setIsPendingTallyOrder(false);
        setOrderHeader({ ...defaultOrderHeader, order_acceptance_id: '', order_acceptance_date: new Date().toISOString().split('T')[0] });
        setOrderItems([{ ...defaultOrderItem }]);
        setActiveTab('order-new');
    };

    const loadOrders = async () =>{
        try{
            const ord = await API.fetchOrders(sessionToken);
            if (!ord){setAlertMessage("Failed to load orders from DB"); setIsAlertOpen(true);}
            else setOrders(Array.isArray(ord) ? ord : []);
        }catch(err){
            setAlertMessage("Error occured while loading items: ", err.message);
            setIsAlertOpen(true);
        }
    };
    
    const handleFormSubmit = async (e) => {
        // Fix: Ensure `e` exists and is a true event object before calling preventDefault
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        
        const finalHeader = {
            ...orderHeader,
            ordered_by: user.email,
            customer_code: isNewClient ? "TEMP_UNREGISTERED_HOLDER" : orderHeader.customer_code
        };

        try {
            await commitOrderSubmit(finalHeader, orderItems);
            
            // Post-Submission Redirect Check modified for CompanyEntryForm routing view targets
            if (isNewClient) {
                
                setCompanyForm(prev => ({
                    ...prev,
                    name: temporaryClientName || finalHeader.billing_name || "",
                    address_line_1: finalHeader.billing_address || "", city: "", state: "", pincode: "",
                    contact_name: "", contact_role: "", contact_phone: ""
                }));
                setAlertMessage("🎉 Order staged! Please finish registering the client profile now.");
                setActiveTab('company-new'); // Switch cleanly to view target route
            }
        } catch (err) {
            showErrorModal("Submission Failed", err.message);
        }
    };

    const commitOrderSubmit = async (passedHeader, passedItems) => {

        // 2. Validate using the passed payload, or fallback to state if needed
        const headerToSubmit = passedHeader || orderHeader;
        const itemsToSubmit = passedItems || orderItems;

        if(!headerToSubmit.order_acceptance_id){
            setAlertMessage("Order Acceptance ID is required")
            setIsAlertOpen(true);
            return;
        }

        if (!headerToSubmit.customer_code || !headerToSubmit.billing_name.trim() || !headerToSubmit.billing_address.trim()) {
            setAlertMessage("Customer Code, Billing Name, and Address are strictly required."); 
            setIsAlertOpen(true); 
            return;
        }

        try {
            if(isPendingTallyOrder){
                const claimed = API.claimPendingOrder(sessionToken, headerToSubmit.order_acceptance_id);
                setAlertMessage(`✅ ${claimed.order_acceptance_id} claimed successfully.`);
                setIsAlertOpen(true);
                setOrderHeader({...defaultOrderHeader});
                setOrderItems({...defaultOrderItem});
                setIsPendingTallyOrder(false);
                await loadOrders();
                setActiveTab('orders-list');
                return;

            }
            const payloadItems = itemsToSubmit.map(item => ({ 
                ...item, 
                amount: Math.round(((item.quantity || 0) * (item.rate || 0) * (1.0 - ((item.discount_percentage || 0) / 100.0))) * 100) / 100 
            }));

            const savedData = await API.saveOrder({ ...headerToSubmit, items: payloadItems }, sessionToken);
            
            setAlertMessage("Order successfully shared to factory.");
            /*executePrintWorkflow(savedData, 'order');*/
            setOrderHeader({ ...defaultOrderHeader }); 
            setOrderItems([{ ...defaultOrderItem }]); 
            await loadOrders();
            setActiveTab('orders-list');
        } catch (err) { 
            alert(err.message); 
        }
    };

    return{loadOrders, commitOrderSubmit, handleFormSubmit, triggerNewOrderInitialization};
}