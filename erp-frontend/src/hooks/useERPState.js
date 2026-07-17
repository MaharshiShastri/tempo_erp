import { useState, useEffect, useCallback } from "react";
import API from "../api/api";
import useTasks from "./tasks/useTasks";
import useDispatchHub from "./dispatch/useDispatchHub";
import useLogisticsHub from "./logistics/useLogisticsHub";
import useCompanyMaster from "./company/useCompanyMaster";
import useItemMaster from "./items/useItemMaster";
import useOrders from "./orders/useOrders";
import useBilling from "./billing/useBilling";
import useCore from "./useCore";

const API_HOST = window.location.hostname;

export default function useERPState() {
    
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    const [isServerLive, setIsServerLive] = useState(true);
    
    const factoryRoles = ["Shop Floor Administrator", "Admin", "Chief Full Stack Developer"];
    const salesRoles = ["Sales Representative", "Admin", "Chief Full Stack Developer"];
    const transportRoles = ["Dispatch Engineer", "Admin", "Chief Full Stack Developer"];

    const core = useCore();
    
    const dispatchSystemNotification = (title, message) => {
        core.setAlertMessage(`[SYSTEM ALERT] ${title}: ${message}`);
        core.setIsAlertOpen(true);

        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body: message });
        }
    };
    //Division of states into different hooks
    
    //const master = useMasterData({sessionToken: sessionToken, user: user});
    const tasks = useTasks({sessionToken: core.sessionToken, user: core.user, showErrorModal: core.showErrorModal, addToast: core.addToast, dispatchSystemNotification, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen});
    const dispatch = useDispatchHub({sessionToken: core.sessionToken, showErrorModal: core.showErrorModal, addToast: core.addToast});
    const logistics = useLogisticsHub({sessionToken: core.sessionToken, showErrorModal: core.showErrorModal, addToast: core.addToast});
    const companies = useCompanyMaster({sessionToken: core.sessionToken, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen, setActiveTab: core.setActiveTab});
    const items = useItemMaster({sessionToken: core.sessionToken, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen});
    const orders = useOrders({sessionToken: core.sessionToken, companiesMaster: companies.companiesMaster, itemsMaster: items.itemsMaster, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen, setActiveTab: core.setActiveTab});
    const billing = useBilling({sessionToken: core.sessionToken, orders: orders.orders, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen, setActiveTab: core.setActiveTab});

    useEffect(() => {
        if (!core.user || !core.sessionToken) return;
        items.refreshItems();
        if (salesRoles.includes(core.user.role)) {
            companies.refreshCompanies();
            orders.loadOrders();
            billing.loadBills();
        }

        if (transportRoles.includes(core.user.role)) {
            dispatch.loadPartners();
        }

        if (factoryRoles.includes(core.user.role)) {
            tasks.loadTasks();
        }
    }, [core.user, core.sessionToken]);

    useEffect(() => {
        if (!core.sessionToken) return;
        
        // Connect to the unified stream router
        const eventSource = new EventSource(`/api/v1/stream/events?token=${core.sessionToken}`);
        
        let timeoutTimer;

        // Reset the timeout timer every time we receive data (heartbeat or payload)
        const resetPulseTimer = () => {
            setIsServerLive(true);
            clearTimeout(timeoutTimer);
            // If we don't hear from the server for 5 minutes, assume it's offline/restarting
            timeoutTimer = setTimeout(() => setIsServerLive(false), 300000); 
        };

        eventSource.onmessage = (event) => {
            resetPulseTimer();
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'SYSTEM_PULSE') {
                    return; // Just a heartbeat, do nothing else.
                }

                // Handle actual incoming notification
                if (data.type === 'TASK' || data.type === 'FAQ' || data.type === 'ORDER_STAGE') {
                    setNotifications(prev => [{...data, read: false}, ...prev]);
                    setUnreadNotifCount(prev => prev + 1);
                    core.addToast(`${data.title}`, 'info');

                }
            } catch(e) {
                console.error('Failed to parse SSE payload.', e);
            }
        };

        eventSource.onerror = (error) => {
            setIsServerLive(false);
        };

        resetPulseTimer(); // Start the initial timer

        return () => {
            clearTimeout(timeoutTimer);
            if (eventSource.readyState !== 2){
                eventSource.close();
            }
        };
    }, [core.sessionToken]);

    const markAllNotifsRead = () => {
        setUnreadNotifCount(0);
        setNotifications(prev => prev.map(n => ({...n, read: true})));
    };

    return {
        ...core, ...tasks, ...dispatch, ...logistics, ...companies, ...items, ...orders,
        ...billing, notifications, unreadNotifCount, markAllNotifsRead, isServerLive
    };
}