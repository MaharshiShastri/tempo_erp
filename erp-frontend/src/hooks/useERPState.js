import { useState, useEffect, useCallback, act } from "react";
import API from "../api/api";
import useTasks from "./tasks/useTasks";
import useDispatchCalculator from "./dispatch/useDispatchCalculatorHub";
import useLogisticsHub from "./logistics/useLogisticsHub";
import useCompanyMaster from "./company/useCompanyMaster";
import useItemMaster from "./items/useItemMaster";
import useOrders from "./orders/useOrders";
import useBilling from "./billing/useBilling";
import useCore from "./useCore";
import useActivityHub from "./activitydashboard/useActivityDashboardHub";
import useAdminHub from "./admin/useAdminHub";
import useCRMHub from "./CRM/useCRMHub";
import useFAQHub from "./faq/useFAQHub";
import useProductionHub from "./production/useProductionHub";
import useGRN from "./grn/useGRN";
import useLeadGenerator from "./leads/useLeadGenerator";
import useLogin from "./useLogin";
import useAnalytics from "./analytics/useAnalytics";
import useGeo from "./geographic/useGeo";
import useDispatchPlannerHub from "./dispatch/useDispatchPlannerHub";
import useQuotation from "./useQuotation";
import useExerciseGenerator from "./useExerciseGenerator";
import useProductionCalendar from "./useProductionCalendar";
import { usePromptGenerator } from "./usePromptGenerator";

const API_HOST = window.location.hostname;

export default function useERPState() {
    
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    
    const [isServerLive, setIsServerLive] = useState(true);
    const [isProductionScheduleModalOpen, setIsProductionScheduleModalOpen] = useState(false);

    const [productionScheduleForm, setProductionScheduleForm] = useState(null);

    const [isEditingProductionSchedule, setIsEditingProductionSchedule] = useState(false);

    const factoryRoles = ["Shop Floor Administrator", "Admin", "Chief Full Stack Developer"];
    const salesRoles = ["Sales Representative", "Admin", "Chief Full Stack Developer"];
    const transportRoles = ["Dispatch Engineer", "Admin", "Chief Full Stack Developer"];
    const adminRoles = ["Admin", "Chief Full Stack Developer"];

    const onCreateSchedule = useCallback((defaults = {}) => {
        setIsEditingProductionSchedule(false);

        setProductionScheduleForm({
            order_id: "",
            stage_code: "",
            planned_start: defaults.planned_start || "",
            planned_end: defaults.planned_end || "",
            priority: 0,
            assigned_team: "",
            status: "PLANNED",
        });

        setIsProductionScheduleModalOpen(true);
    }, []);
    
    const onEditSchedule = useCallback((schedule) => {
        if (!schedule) {
            return;
        }

        setIsEditingProductionSchedule(true);

        setProductionScheduleForm({
            id: schedule.id,

            order_id: schedule.order_id || "",
            stage_code: schedule.stage_code || "",

            planned_start:
                schedule.planned_start || "",

            planned_end:
                schedule.planned_end || "",

            actual_start:
                schedule.actual_start || "",

            actual_end:
                schedule.actual_end || "",

            priority:
                schedule.priority ?? 0,

            assigned_team:
                schedule.assigned_team || "",

            status:
                schedule.status || "PLANNED",

            // Useful display-only fields
            order_acceptance_id:
                schedule.order_acceptance_id || null,

            client_name:
                schedule.client_name || null,
        });

        setIsProductionScheduleModalOpen(true);
    }, []);

    const closeProductionScheduleModal = useCallback(() => {
        setIsProductionScheduleModalOpen(false);
        setProductionScheduleForm(null);
        setIsEditingProductionSchedule(false);
    }, []);

    //const rndRoles = [""]
    const core = useCore();
    const login = useLogin(core);
    
    const dispatchSystemNotification = (title, message) => {
        core.setAlertMessage(`[SYSTEM ALERT] ${title}: ${message}`);
        core.setIsAlertOpen(true);

        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body: message });
        }
    };
    //Division of states into different hooks
    //Global business state independent
    const items = useItemMaster({sessionToken: core.sessionToken, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen});
    const indiaMap = useGeo({sessionToken: core.sessionToken, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen, showErrorModal: core.showErrorModal, itemsMaster: items.itemsMaster});
    const productionCalendar = useProductionCalendar({sessionToken: core.sessionToken, showErrorModal: core.showErrorModal, onCreateSchedule: onCreateSchedule, onEditSchedule: onEditSchedule});
    const promptGenerator = usePromptGenerator({sessionToken: core.sessionToken});

    //All admin business states
    const admin = useAdminHub({sessionToken: core.sessionToken, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen});
    const exerciseGenerator = useExerciseGenerator({sessionToken: core.sessionToken, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen});
    
    //All the shop floor business states
    const tasks = useTasks({sessionToken: core.sessionToken, user: core.user, showErrorModal: core.showErrorModal, addToast: core.addToast, dispatchSystemNotification, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen});
    const activity = useActivityHub({sessionToken: core.sessionToken, user: core.user, showErrorModal: core.showErrorModal, addToast: core.addToast, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen});
    const grn = useGRN({sessionToken: core.sessionToken, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen, itemsMaster: items.itemsMaster});

    //all the sales business state
    const companies = useCompanyMaster({sessionToken: core.sessionToken, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen, setActiveTab: core.setActiveTab});
    const orders = useOrders({sessionToken: core.sessionToken, user: core.user, companiesMaster: companies.companiesMaster, itemsMaster: items.itemsMaster, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen, setActiveTab: core.setActiveTab, showErrorModal: core.showErrorModal, setCompanyForm: companies.setCompanyForm, setIsEditingCompany: companies.setIsEditingCompany});
    const billing = useBilling({sessionToken: core.sessionToken, orders: orders.orders, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen, setActiveTab: core.setActiveTab, setIsBillingSameAsCustomer: orders.setIsBillingSameAsCustomer});
    const crm = useCRMHub({sessionToken: core.sessionToken, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.isAlertOpen});
    const leadTargets = useLeadGenerator({user: core.user, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen, showErrorModal: core.showErrorModal});
    const qoutation = useQuotation({sessionToken: core.sessionToken, showErrorModal: core.showErrorModal});

    //all the logistcsi business state
    const dispatch = useDispatchCalculator({sessionToken: core.sessionToken, showErrorModal: core.showErrorModal, addToast: core.addToast});
    const logistics = useLogisticsHub({sessionToken: core.sessionToken, setModalAlert: login.setModalAlert, showErrorModal: core.showErrorModal, addToast: core.addToast});
    const dispatchPlanner = useDispatchPlannerHub({sessionToken: core.sessionToken, showErrorModal: core.showErrorModal, addToast: core.addToast});

    //Global business state dependent
    const faq = useFAQHub({sessionToken: core.sessionToken, user: core.user, showErrorModal: core.showErrorModal, addToast: core.addToast, setAlertMessage: core.setAlertMessage, setIsAlertOpen: core.setIsAlertOpen});
    const production = useProductionHub({sessionToken: core.sessionToken, user: core.user, addToast: core.addToast, showErrorModal: core.showErrorModal, orders: orders.orders, setOrders: orders.setOrders});
    const analytics = useAnalytics({sessionToken: core.sessionToken, user: core.user, showErrorModal: core.showErrorModal});

    useEffect(() => {
        if (!core.user || !core.sessionToken) return;

        //Global Modules
        items.refreshItems?.(); 
        faq.loadFaqs?.();
        production.loadPulse?.();
        analytics.fetchAnalytics?.(core.user.role, analytics.fromDate, analytics.toDate);
        core.getUsers?.(core.sessionToken);
        indiaMap.loadIndia?.();//loading map

        if (salesRoles.includes(core.user.role)) { //Sales module refresh
            companies.refreshCompanies?.();
            orders.loadOrders?.();
            billing.loadBills?.();
            crm.loadLeads?.();
            leadTargets.loadTargets?.();
            qoutation.loadQuotations?.();
        }

        if (transportRoles.includes(core.user.role)) { //Transport module refresh
            dispatch.loadPartners?.();
        }

        if (factoryRoles.includes(core.user.role)) { //Shop floor module refresh
            tasks.loadTasks?.();
            activity.loadData?.();
        }

        if(adminRoles.includes(core.user.role)){
            admin.loadUsers?.();
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
        ...companies, ...orders, ...billing, ...crm, ...leadTargets, ...qoutation, //Sales Business states unwinding
        dispatchPlanner,  ...logistics, ...dispatch, //Logistics business states
        ...tasks, ...activity, ...grn, //Shop floor business states
        ...admin, ...indiaMap, ...exerciseGenerator,//Admin business states
        ...faq, ...items, ...production, ...login, ...analytics, ...core, ...productionCalendar, ...promptGenerator, //Global business states
        notifications, unreadNotifCount, markAllNotifsRead, isServerLive
    };
}