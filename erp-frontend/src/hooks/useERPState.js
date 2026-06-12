import { useState, useEffect } from "react";
import API from "../api/api";

export default function useERPState() {
    const [user, setUser] = useState(() => {
        const cache = localStorage.getItem('invoice_session');
        return cache ? JSON.parse(cache) : null;
    });

    const [activeTab, setActiveTab] = useState('orders-list');
    const [orders, setOrders] = useState([]);
    const [bills, setBills] = useState([]);
    const [tasks, setTasks] = useState([]); 
    const [toasts, setToasts] = useState([]);
    const [dashboardData, setDashboardData] = useState({ past: [], ongoing: [], future: [] });
    const [systemUsers, setSystemUsers] = useState([]);
    const [dispatch, setDispatch] = useState([]);
    const [companiesMaster, setCompaniesMaster] = useState([]);
    const [itemsMaster, setItemsMaster] = useState([]);
    
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [isBillingSameAsCustomer, setIsBillingSameAsCustomer] = useState(true);

    const defaultOrderHeader = { order_acceptance_id: '', order_acceptance_date: '', purchase_order_number: '', purchase_order_date: '', customer_code: '', payment_terms: '', billing_name: '', billing_address: '', due_date: '' };
    const defaultOrderItem = { item_code: '', additional_spec_text: '', hsn_code: '', quantity: 1, unit_measure: 'NOS', rate: 0.00, discount_percentage: 0.00 };
    const defaultCompanyForm = { name: '', address_line_1: '', city: '', state: '', pincode: '', contact_name: '', contact_role: '', contact_phone: '' };
    const defaultItemForm = { item_code: '', item_name: '', item_group: '', rate: 0, unit_measure: 'in', additional_spec_text: '', hsn_code: '', revision_no: '', drawing_no: '' };

    const [orderHeader, setOrderHeader] = useState({ ...defaultOrderHeader });
    const [orderItems, setOrderItems] = useState([{ ...defaultOrderItem }]);
    const [companyForm, setCompanyForm] = useState({ ...defaultCompanyForm });
    
    const [billHeader, setBillHeader] = useState({ bill_num: '', bill_date: '', order_acceptance_id: '' });
    const [billItems, setBillItems] = useState([]);

    const [activePrintJob, setActivePrintJob] = useState(null);
    const [printType, setPrintType] = useState(null);
    const [itemForm, setItemForm] = useState({ ...defaultItemForm });
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemDetail, setItemDetail] = useState(null);
    const [isEditingItem, setIsEditingItem] = useState(false);
    
    const sessionToken = user ? user.access_token : null;

    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    const dispatchSystemNotification = (title, message) => {
        setAlertMessage(`[SYSTEM ALERT] ${title}: ${message}`);
        setIsAlertOpen(true);
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body: message });
        }
    };

    useEffect(() => {
        if (sessionToken) refreshDataHub();
    }, [sessionToken]);

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Ignore keystrokes if the user isn't logged in or a modal is open
            if (!sessionToken || isAlertOpen) return;

            // Prevent default browser behavior for our specific shortcuts
            const isAltShortcut = e.altKey && ['c', 'i', 'o', 'b', 't', 'n'].includes(e.key.toLowerCase());
            const isCtrlS = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's';
            
            if (isAltShortcut || isCtrlS) {
                e.preventDefault();
            }

            // 1. Contextual Save (Ctrl + S)
            if (isCtrlS) {
                // Find the active form's submit button and click it to preserve HTML5 validation
                const activeSubmitBtn = document.querySelector('form button[type="submit"]');
                if (activeSubmitBtn) activeSubmitBtn.click();
                return;
            }

            // 2. Global Navigation (Alt + Key)
            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'c': setActiveTab('companies-list'); break;
                    case 'i': setActiveTab('items-master'); break;
                    case 'o': setActiveTab('orders-list'); break;
                    case 'b': setActiveTab('bills-list'); break;
                    case 't': setActiveTab('tasks-workspace'); break;
                    case 'd': setActiveTab('dispatch-planner'); break;
                    case 'p': setActiveTabe('accountability-hub'); break;
                    case 'n': // Contextual New Record
                        if (activeTab.includes('company')) setActiveTab('company-new');
                        else if (activeTab.includes('order')) triggerNewOrderInitialization();
                        else if (activeTab.includes('bill')) setActiveTab('bill-new');
                        break;
                }
                return;
            }

            // 3. Escape to Discard / Go Back
            if (e.key === 'Escape') {
                if (activeTab === 'company-new') setActiveTab('companies-list');
                else if (activeTab === 'order-new') setActiveTab('orders-list');
                else if (activeTab === 'bill-new') setActiveTab('bills-list');
            }
        };

        // Attach listener to window
        window.addEventListener('keydown', handleGlobalKeyDown);
        
        // Cleanup loop to prevent memory leaks
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [sessionToken, activeTab, isAlertOpen]);

    useEffect(() => {
        if (!isBillingSameAsCustomer && orderHeader.customer_code) {
            const matched = companiesMaster.find(c => c.id === orderHeader.customer_code);
            if (matched) {
                setOrderHeader(prev => ({
                    ...prev,
                    billing_name: prev.billing_name === matched.name ? "" : prev.billing_name,
                    billing_address: prev.billing_address === matched.address ? "" : prev.billing_address
                }));
            }
        } else if (isBillingSameAsCustomer && orderHeader.customer_code) {
            const matched = companiesMaster.find(c => c.id === orderHeader.customer_code);
            if (matched) {
                setOrderHeader(prev => ({ ...prev, billing_name: matched.name, billing_address: matched.address }));
            }
        }
    }, [isBillingSameAsCustomer, orderHeader.customer_code, companiesMaster]);

    const refreshDataHub = async () => {
        try {
            const [ord, bl, comp, itm, tsk, usersData, dispatchData] = await Promise.all([
                API.fetchOrders(sessionToken),
                API.fetchBills(sessionToken),
                API.fetchCompaniesMaster(sessionToken),
                API.fetchTasks(sessionToken),
                API.getPartners(sessionToken).then(r => r.data),
                fetch('/api/v1/auth/users', {headers: {'Authorization': `Bearer ${sessionToken}`}}).then(r => r.json())
            ]);
            setOrders(ord); setBills(bl); setCompaniesMaster(comp); setItemsMaster(itm); setTasks(tsk); setSystemUsers(usersData); setDispatch(dispatchData);
        } catch (e) {
            setErrorMessage('Network transmission failure across Postgres nodes.');
        }
    };

    const refreshDashboard = async () => {
        try {
            const data = await API.fetchActivityTree(sessionToken);
            setDashboardData(data);
        } catch (err) {
            setAlertMessage("Failed to sync Production Pulse: " + err.message);
            setIsAlertOpen(true);
        }
    };

    const evaluateDispatch = async (payload) => {
        try {
            const res = await API.evaluateDispatch(payload, user?.sessionToken);
            return res;
        } catch (err) {
            setAlertMessage(err.message);
            setIsAlertOpen(true);
            throw err;
        }
    };

    const saveDispatchPartner = async (payload) => {
        try {
            const res = await API.saveDispatchPartner(payload, sessionToken);
            await refreshDataHub();
            return res;
        } catch (err) {
            setAlertMessage(err.message);
            setIsAlertOpen(true);
            throw err;
        }
    };
    const triggerNewOrderInitialization = () => {
        setIsBillingSameAsCustomer(true);
        setOrderHeader({ ...defaultOrderHeader, order_acceptance_id: '', order_acceptance_date: new Date().toISOString().split('T')[0] });
        setOrderItems([{ ...defaultOrderItem }]);
        setActiveTab('order-new');
    };

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

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setErrorMessage('');
            const data = await API.login(loginEmail, loginPassword);
            localStorage.setItem('invoice_session', JSON.stringify(data));
            setUser(data);
        } catch (err) { setErrorMessage('Access denied. Invalid signature parameters.'); }
    };

    const handleLogout = () => { localStorage.removeItem('invoice_session'); setUser(null); };
    const appendOrderItemRow = () => setOrderItems([...orderItems, { ...defaultOrderItem }]);
    const popOrderItemRow = (idx) => setOrderItems(orderItems.filter((_, i) => i !== idx));
    const updateOrderItemField = (idx, field, val) => {
        const items = [...orderItems];
        items[idx][field] = val;
        setOrderItems(items);
    };

    const commitOrderSubmit = async (e) => {
        e.preventDefault();
        if (!orderHeader.customer_code || !orderHeader.billing_name.trim() || !orderHeader.billing_address.trim()) {
            setAlertMessage("Customer Code, Billing Name, and Address are strictly required."); setIsAlertOpen(true); return;
        }
        try {
            const payloadItems = orderItems.map(item => ({ ...item, amount: Math.round(((item.quantity || 0) * (item.rate || 0) * (1.0 - ((item.discount_percentage || 0) / 100.0))) * 100) / 100 }));
            const savedData = await API.saveOrder({ ...orderHeader, items: payloadItems }, sessionToken);
            setAlertMessage("Order successfully shared to factory.")
            executePrintWorkflow(savedData, 'order');
            setOrderHeader({ ...defaultOrderHeader }); setOrderItems([{ ...defaultOrderItem }]); refreshDashboard();
            await refreshDataHub(); setActiveTab('orders-list');
        } catch (err) { alert(err.message); }
    };

    const commitCompanySubmit = async (e) => {
        e.preventDefault();
        try {
            await API.saveCompanyMaster(companyForm, sessionToken);
            setCompanyForm({ ...defaultCompanyForm });
            await refreshDataHub(); setActiveTab('companies-list');
        } catch (err) { setAlertMessage(err.message); setIsAlertOpen(true); }
    };

    const triggerInvoiceSetupForOrder = (oaId) => {
        const targetOrder = orders.find(o => o.order_acceptance_id === oaId);
        if (!targetOrder) return;
        setBillHeader({ bill_num: `INV-${Date.now().toString().slice(-4)}`, bill_date: new Date().toISOString().split('T')[0], order_acceptance_id: oaId });
        setBillItems(targetOrder.items.map(item => ({ order_item_id: item.order_item_id, item_code: item.item_code, quantity_ordered: item.quantity, quantity_shipped: item.quantity })));
        setActiveTab('bill-new');
    };

    const commitBillSubmit = async (e) => {
        e.preventDefault();
        try {
            const savedBill = await API.saveBill({ bill_num: billHeader.bill_num, bill_date: billHeader.bill_date, order_acceptance_id: billHeader.order_acceptance_id, items: billItems.map(b => ({ order_item_id: b.order_item_id, quantity_shipped: parseInt(b.quantity_shipped) })) }, sessionToken);
            executePrintWorkflow(savedBill, "invoice");
            setBillHeader({ bill_num: '', bill_date: '', order_acceptance_id: '' }); setBillItems([]);
            await refreshDataHub(); setActiveTab('bills-list');
        } catch (err) { alert(err.message); }
    };

    const handleCreateTask = async (payload) => {
        try {
            const r = await API.saveTask(payload, sessionToken);
            setTasks(prev => [...prev, r]);
            dispatchSystemNotification("Task Dispatched", `Notification sent to assigned operators.`);
        } catch (e) { setAlertMessage(e.message); setIsAlertOpen(true); }
    };
  
    const commitItemSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.saveItemMaster(itemForm, sessionToken);
            setItemForm({ ...defaultItemForm });
            await refreshDataHub(); // Refreshes itemsMaster array globally
            setAlertMessage("Product successfully added to Item Master.");
            setIsAlertOpen(true);
        } catch (err) {
            setAlertMessage(err.message || 'Validation rejected creating item profile.');
            setIsAlertOpen(true);
        }
    };

    const handleToggleTask = async (taskId) => {
        try {
            const updatedTask = await API.toggleTaskStatus(taskId, sessionToken);
            setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
        } catch (err) { setAlertMessage(err.message); setIsAlertOpen(true); }
    };

    const executePrintWorkflow = (data, type) => {
        setActivePrintJob(data); setPrintType(type);
        setTimeout(() => { window.print(); setActivePrintJob(null); setPrintType(null); }, 300);
    };

    const addToast = (message, type="info") => {
        const id = Date.now();
        setToasts(prev => [...prev, {id, message, type}]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));   
        }, 5000);
    };
    
    //Web socket, later make websocket into dedicated api file
    useEffect(()=>{
        if (!sessionToken) return;

        const ws = new WebSocket(`ws://192.163.0.168:8000/api/v1/ws/floor?token=${sessionToken}`);

        ws.onmessage = (event) => {
            try{
                const data = JSON.parse(event.data);
                addToast(`[${data.entity_id}] ${data.message}`, data.type || 'info');
            } catch(e){
                addToast(event.data, info);
            }
        };

        ws.onerror = (error) => {
            alert("WebSocket error: ", error);
        };

        return () =>{
            if(ws.readyState === 1){
                ws.close();
            }
        };
    }, [sessionToken]);
    return {
        systemUsers, user, setUser, activeTab, setActiveTab, orders, bills, companiesMaster, itemsMaster, isAlertOpen, setIsAlertOpen, alertMessage, errorMessage, loginEmail, setLoginEmail, loginPassword, setLoginPassword,
        orderHeader, setOrderHeader, orderItems, appendOrderItemRow, popOrderItemRow, updateOrderItemField, commitOrderSubmit, handleCustomerMasterSelection, handleItemMasterSelection, triggerNewOrderInitialization,
        billHeader, setBillHeader, billItems, setBillItems, triggerInvoiceSetupForOrder, commitBillSubmit, handleLogin, handleLogout,
        isBillingSameAsCustomer, setIsBillingSameAsCustomer, companyForm, setCompanyForm, commitCompanySubmit,
        tasks, handleCreateTask, handleToggleTask, executePrintWorkflow, activePrintJob, printType, itemForm, setItemForm, commitItemSubmit, selectedItem, itemDetail, isEditingItem, dashboardData, refreshDashboard
    };
}

