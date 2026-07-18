import { useState, useCallback, useEffect } from "react";
import API from "../api/api";

export default function useActivityDashboard({sessionToken, user, showErrorModal, addToast, setAlertMessage, setIsAlertOpen}){
    const [treeData, setTreeData] = useState({ past: [], ongoing: [], future: [] });
    const [loading, setLoading] = useState(true);
    const [openSection, setOpenSection] = useState('ongoing'); 
    const [openRows, setOpenRows] = useState(new Set());
        
    // Manual Logging State
    const [manualLogInputs, setManualLogInputs] = useState({});
    const [isSubmittingLog, setIsSubmittingLog] = useState(false);
    
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await API.fetchActivityTree(sessionToken);
            setTreeData(data);
        } catch (err) {
            setAlertMessage(err.message);
            setIsAlertOpen(true);
        } finally {
            setLoading(false);
        }
    }, [sessionToken, setAlertMessage, setIsAlertOpen]);
    
    const toggleSection = (sectionKey) => {
        setOpenSection(prev => prev === sectionKey ? null : sectionKey);
        setOpenRows(new Set()); 
    };
    
    const toggleRow = (orderId) => {
        setOpenRows(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    };
    
    const handleAddManualLog = async (orderId) => {
        const message = manualLogInputs[orderId];
        if (!message?.trim()) return;
    
        setIsSubmittingLog(true);
        try {
            await API.addManualActivityLog(orderId, { message }, sessionToken);
            setManualLogInputs(prev => ({ ...prev, [orderId]: "" }));
            addToast("Activity manually logged.", "success");
            await loadData();
        } catch (err) {
            showErrorModal("Logging Failed", err.message);
        } finally {
            setIsSubmittingLog(false);
        }
    };
    
    const handleDeleteLog = async (logId) => {
        if (user.role !== 'Admin' && user.role !== 'Chief Full Stack Developer') {
            showErrorModal("Unauthorized", "Only System Administrators can alter the audit trail.");
            return;
        }
    
        if (!window.confirm("WARNING: Deleting an audit log alters the immutable history of this order. Proceed?")) return;
    
        try {
            await API.deleteActivityLog(logId, sessionToken);
            addToast("Audit log wiped.", "success");
            await loadData();
        } catch (err) {
            showErrorModal("Deletion Failed", err.message);
        }
    };
    
    useEffect(() => { 
        if(sessionToken) loadData(); 
    }, [sessionToken, loadData]);
    
    
    return{loadData, toggleSection, toggleRow, setManualLogInputs, handleAddManualLog, handleDeleteLog,
        treeData, setTreeData, loading, setLoading, openSection, setOpenSection, openRows, setOpenRows,
        manualLogInputs, setManualLogInputs, isSubmittingLog
    };

}