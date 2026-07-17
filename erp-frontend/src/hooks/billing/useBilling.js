import { useState } from "react";
import API from "../../api/api";

export default function useBilling({sessionToken, orders, setAlertMessage, setIsAlertOpen, setActiveTab}){
    const [billHeader, setBillHeader] = useState({ bill_num: '', bill_date: '', order_acceptance_id: '' });
    const [bills, setBills] = useState([]);

    const loadBills = async() =>{
        try{
            const billList = await API.fetchBills(sessionToken);
            if (!billList) {setAlertMessage("Failed to load orders from DB"); setIsAlertOpen(true);}
            else setBills(billList);
        }catch(err){
            setAlertMessage("Error occured while loading bills: ", err.message);
            setIsAlertOpen(true);
        }
    }

    const commitBillSubmit = async (e) => {
        e.preventDefault();
        try {
            const savedBill = await API.saveBill({ bill_num: billHeader.bill_num, bill_date: billHeader.bill_date, order_acceptance_id: billHeader.order_acceptance_id, items: billItems.map(b => ({ order_item_id: b.order_item_id, quantity_shipped: parseInt(b.quantity_shipped) })) }, sessionToken);
            executePrintWorkflow(savedBill, "invoice");
            setBillHeader({ bill_num: '', bill_date: '', order_acceptance_id: '' }); setBillItems([]);
            await refreshDataHub(); setActiveTab('bills-list');
        } catch (err) { alert(err.message); }
    };

    const triggerInvoiceSetupForOrder = (oaId) => {
        const targetOrder = orders.find(o => o.order_acceptance_id === oaId);
        if (!targetOrder) return;
        setBillHeader({ bill_num: `INV-${Date.now().toString().slice(-4)}`, bill_date: new Date().toISOString().split('T')[0], order_acceptance_id: oaId });
        setBillItems(targetOrder.items.map(item => ({ order_item_id: item.order_item_id, item_code: item.item_code, quantity_ordered: item.quantity, quantity_shipped: item.quantity })));
        setActiveTab('bill-new');
    }; 

    const triggerNewOrderInitialization = () => {
        setIsBillingSameAsCustomer(true);
        setOrderHeader({ ...defaultOrderHeader, order_acceptance_id: '', order_acceptance_date: new Date().toISOString().split('T')[0] });
        setOrderItems([{ ...defaultOrderItem }]);
        setActiveTab('order-new');
    };
    return {loadBills, bills, commitBillSubmit, triggerInvoiceSetupForOrder, triggerNewOrderInitialization};
}