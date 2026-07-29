import { useState } from "react";
import API from "../../api/api";

export default function useItemMaster({sessionToken, setAlertMessage, setIsAlertOpen}){
    const defaultItemForm = { item_code: '', item_name: '', item_group: '', rate: 0, unit_measure: 'in', additional_spec_text: '', hsn_code: '', revision_no: '', drawing_no: '' };

    const [itemsMaster, setItemsMaster] = useState([]);
    const [itemForm, setItemForm] = useState({ ...defaultItemForm });
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemDetail, setItemDetail] = useState(null);
    const [isEditingItem, setIsEditingItem] = useState(false);
    const [stockModal, setStockModal] = useState({operation: "add", itemCode: "", quantity: 0, remarks: ""});
    const [stockModalOpen, setStockModalOpen] = useState(false);

    const [stockLedger, setStockLedger] = useState([]);

    const refreshItems = async() =>{
        try{
            const items = await API.fetchItemMaster(sessionToken);
            if (!items) {setAlertMessage("Failed to load Items from DB"); setIsAlertOpen(true);}
            else setItemsMaster(Array.isArray(items) ? items : []);
        }catch(err){
            setAlertMessage("Error occured while loading items: ", err.message);
            setIsAlertOpen(true);
        }
    }

    const commitItemSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.saveItemMaster(itemForm, sessionToken);
            setItemForm({ ...defaultItemForm });
            setAlertMessage("Product successfully added to Item Master.");
            setIsAlertOpen(true);
        } catch (err) {
            setAlertMessage(err.message || 'Validation rejected creating item profile.');
            setIsAlertOpen(true);
        }
    };

    function openStockModal(item){
        setSelectedItem(item);

        setStockModal({open: true, itemCode: item.item_code, operation: "add", quantity: 0, remarks: ""});
        setStockModalOpen(true);
    }

    const closeStockModal = () =>{
        setStockModalOpen(false);
        setSelectedItem(null);
        setStockModal({operation: "add", itemCode: "", quantity: 0, remarks: ""});
    }

    async function saveStockAdjustment(){
        await API.adjustItemStock(sessionToken, {
            item_code: stockModal.itemCode,
            operation: stockModal.operation,
            quantity_change: Number(stockModal.quantity),
            remarks: stockModal.remarks
        });

        closeStockModal();
        await refreshItems();
    }
    
    async function refreshStockLedger(){
        const logs = await API.fetchStockLedger(sessionToken);
        setStockLedger(logs);
    }
    return {itemsMaster, refreshItems, commitItemSubmit, defaultItemForm, setItemsMaster, itemForm,
        setItemForm, selectedItem, setSelectedItem, itemDetail, setItemDetail, isEditingItem, setIsEditingItem, 
        stockModal, setStockModal, stockModalOpen, openStockModal, closeStockModal, saveStockAdjustment,
        stockLedger, refreshStockLedger,
    };
}