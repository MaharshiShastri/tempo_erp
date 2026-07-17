import { useState } from "react";
import API from "../api/api";
import useOrders from "./orders/useOrders";
import useBilling from "./billing/useBilling";
import useCompanyMaster from "./company/useCompanyMaster";
import useItemMaster from "./items/useItemMaster";
import useDispatchSystem from "./dispatch/useDispatchHub";

export default function useMasterData(){
    const [systemUsers, setSystemUsers] = useState([]);

    const lodaMasterData = async () => {
        try {
            const [ord, bl, comp, usersData, dispatchData, itemList] = await Promise.all([
                //API.fetchOrders(sessionToken),
                API.fetchBills(sessionToken),
                //API.fetchCompaniesMaster(sessionToken),
                fetch('/api/v1/auth/users', {headers: {'Authorization': `Bearer ${sessionToken}`}}).then(r => r.json()),
                //API.getPartners(sessionToken).then(r => r.data),
                //API.fetchItemMaster(sessionToken),
            ]);
            useOrders.setOrders(ord); 
            useBilling.setBills(bl); 
            useCompanyMaster.setCompaniesMaster(comp); 
            setSystemUsers(usersData); 
            useDispatchSystem.setDispatch(dispatchData); 
            useItemMaster.setItemsMaster(itemList);
        } catch (e) {
            setErrorMessage('Network transmission failure across Postgres nodes.');
        }
    };
}