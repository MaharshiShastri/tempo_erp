import { useState, useCallback } from "react";
import API from "../../api/api";

export default function useCRMWorkspace({sessionToken, setAlertMessage, setIsAlertOpen}) {

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadLeads = useCallback(async () => {
        if (!sessionToken) return;

        setLoading(true);

        try {
            const data = await API.fetchLeads(sessionToken);
            setLeads(Array.isArray(data) ? data : []);
        } catch (err) {
            setAlertMessage?.("Failed to sync CRM Pipeline: " + err.message);
            setIsAlertOpen?.(true);
        } finally {
            setLoading(false);
        }
    }, [sessionToken, setAlertMessage, setIsAlertOpen]);

    const handleStatusChange = async (leadId, newStatus) => {
        try {
            await API.updateLeadStatus(leadId, newStatus, sessionToken);

            setLeads(prev =>prev.map(l => l.id === leadId ? { ...l, status: newStatus }: l)
            );
        } catch (err) {
            setAlertMessage?.("Database Update Failed: " + err.message);
            setIsAlertOpen?.(true);
        }
    };

    return {leads, loading, loadLeads, handleStatusChange};
}