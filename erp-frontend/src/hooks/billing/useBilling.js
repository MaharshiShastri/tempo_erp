import { useState } from "react";
import API from "../../api/api";

export default function useBilling({sessionToken, orders, setAlertMessage, setIsAlertOpen, setActiveTab}){
    const [billItems, setBillItems] = useState([]);
    const [billHeader, setBillHeader] = useState({ bill_num: '', bill_date: '', order_id: null, order_acceptance_id: '', indian_state: ''});
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
            if (!billHeader.bill_num?.trim()) {
                throw new Error("Bill number is required.");
            }

            if (!billHeader.bill_date) {
                throw new Error("Bill date is required.");
            }

            if (!billHeader.order_id) {
                throw new Error(
                    "This invoice is not linked to an order."
                );
            }

            const payload = {
                bill_num: billHeader.bill_num.trim(),

                bill_date: billHeader.bill_date,

                order_id: Number(billHeader.order_id),

                indian_state:
                    billHeader.indian_state || null,

                items: billItems.map((item) => ({
                    order_item_id:
                        item.order_item_id || null,

                    item_code:
                        item.item_code || null,

                    quantity_shipped:
                        Number(item.quantity_shipped || 0),

                    rate:
                        item.rate != null
                            ? Number(item.rate)
                            : null,

                    amount:
                        item.amount != null
                            ? Number(item.amount)
                            : null,
                })),
            };

            const savedBill =
                await API.saveBill(
                    payload,
                    sessionToken
                );

            setAlertMessage(
                `Invoice ${savedBill.bill_num} created successfully.`
            );

            setIsAlertOpen(true);

            setBillHeader({
                bill_num: '',
                bill_date: '',
                order_id: null,
                order_acceptance_id: '',
                indian_state: ''
            });

            setBillItems([]);

            await loadBills();

            setActiveTab("bills-list");

        } catch (err) {
            setAlertMessage(
                err.message || "Unable to create bill."
            );

            setIsAlertOpen(true);
        }
    };


    const triggerInvoiceSetupForOrder = (oaId) => {

        const targetOrder = orders.find((o) =>o.order_acceptance_id === oaId);

        if (!targetOrder) {
            setAlertMessage(`Order ${oaId} was not found.`);

            setIsAlertOpen(true);

            return;
        }

        const today = new Date().toISOString().split("T")[0];

        const preparedItems =
            (targetOrder.items || []).map(
                (item) => ({
                    order_item_id: item.order_item_id,

                    item_code: item.item_code,

                    quantity_ordered: Number(item.quantity || 0),

                    quantity_shipped: Number(item.pending_quantity ?? item.quantity ?? 0),

                    rate: Number(item.rate || 0),

                    amount: Number(item.amount || 0),
                })
            );

        setBillHeader({bill_num: "", bill_date: today, order_id: Number(targetOrder.order_id), order_acceptance_id: targetOrder.order_acceptance_id, indian_state: targetOrder.state_name || ""});

        setBillItems(preparedItems);

        setActiveTab("bill-new");
    };
    
    return {loadBills, bills, commitBillSubmit, triggerInvoiceSetupForOrder, billItems, setBillItems, billHeader, 
        setBillHeader, setBills,
    };
}