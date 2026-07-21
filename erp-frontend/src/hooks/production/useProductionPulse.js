import { useState, useCallback } from "react";
import API from "../../api/api";

const STAGES = [
    { key: "PO_SUBMITTED", label: "PO Submitted", color: "var(--text-muted)", bg: "var(--bg-main)" },
    { key: "RAW_MATERIAL_ASSEMBLY", label: "Material Assembly", color: "var(--brand-accent)", bg: "#f0f7ff" },
    { key: "PRODUCTION_IN_PROGRESS", label: "In Production", color: "#e67e22", bg: "#fff8f0" },
    { key: "READY_TO_DISPATCH", label: "Ready for Dispatch", color: "var(--brand-success)", bg: "#eaffea" },
    { key: "DISPATCHED", label: "Dispatched & Invoiced", color: "#8e44ad", bg: "#f5eef8" }
];

export default function useProductionPulse({sessionToken, user, addToast, showErrorModal, orders, setOrders}) {

    const [isLoading, setIsLoading] = useState(false);

    const isFactory = ["Shop Floor Administrator", "Admin", "Chief Full Stack Developer"].includes(user?.role);
    const isDispatcher = ["Dispatch Engineer", "Admin", "Chief Full Stack Developer"].includes(user?.role);
    const loadPulse = useCallback(async () => {

        if (!sessionToken) return;

        setIsLoading(true);

        try {

            const data = await API.fetchProductionPulse(sessionToken);

            setOrders(Array.isArray(data) ? data : []);

        } catch (err) {

            showErrorModal?.("Error", err.message);

        } finally {

            setIsLoading(false);

        }

    }, [sessionToken, showErrorModal]);

    const handleMoveStage = async (orderId, currentStage) => {

        const currentIndex = STAGES.findIndex(s => s.key === currentStage);

        if(currentStage === "READY_TO_DISPATCH"){
            if(!isDispatcher) return;
        } else{
            if (!isFactory) return;
        }
        if (currentIndex === -1 || currentIndex === STAGES.length - 1) {
            return;
        }

        const nextStage = STAGES[currentIndex + 1].key;

        // Optimistic update
        setOrders(prev =>
            prev.map(order =>order.order_acceptance_id === orderId? { ...order, production_stage: nextStage}: order)
        );

        try {

            await API.updateOrderStage(orderId, nextStage, sessionToken);

            addToast?.(`Order ${orderId} moved to ${STAGES[currentIndex + 1].label}`, "success");

        } catch (err) {

            await loadPulse();

            showErrorModal?.("Update Failed", err.message);

        }

    };

    return {STAGES, orders, isLoading, isFactory, loadPulse, handleMoveStage, isDispatcher};

}