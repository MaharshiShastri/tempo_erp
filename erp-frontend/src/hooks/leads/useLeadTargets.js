import { useState } from "react";
import API from "../../api/api";

export default function useLeadTargets({user, setAlertMessage, setIsAlertOpen, showErrorModal}){
    const [companyName, setCompanyName] = useState("");
    const [domain, setDomain] = useState("");
    const [targets, setTargets] = useState([]);
    const [expandedTargetId, setExpandedTargetId] = useState(null);
    const [contactsCache, setContactsCache] = useState({});
    const [stagedContacts, setStagedContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    
    
    // Editing States
    const [editingTargetId, setEditingTargetId] = useState(null);
    const [editForm, setEditForm] = useState({ company_name: "", domain: "" });
    
    const loadTargets = async () => {
        try {
            const data = await API.fetchLeadTargets(user.access_token);
            setTargets(data);
        } catch (err) { showErrorModal("Fetch Error", err.message); }
    };

    const handleTargetSubmit = async (e) => {
        e.preventDefault();
        if (file) {
            showErrorModal("Validation Error", "Please use 'Upload Excel' for bulk input. Clear file to use manual entry.");
            return;
        }
        if (!companyName.trim()) {
            showErrorModal("Validation Error", "Please enter both company name and valid domain.");
            return;
        }
        setIsLoading(true);
        try {
            await API.submitLeadTarget({ company_name: companyName, domain }, user.access_token);
            setCompanyName(""); setDomain("");
            await loadTargets();
            if (setAlertMessage) {
                setAlertMessage("✅ Target queued.");
                setIsAlertOpen(true);
            }
        } catch (err) { showErrorModal("Submission Failed", err.message); } 
        finally { setIsLoading(false); }
    };

    const handleBulkUpload = async () => {
        if (!file) return showErrorModal("Validation Error", "Please select an Excel/CSV file.");
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            await API.bulkUploadLeadTargets(formData, user.access_token);
            setFile(null);
            await loadTargets();
            setAlertMessage("📊 Bulk upload successful. Targets queued.");
            setIsAlertOpen(true);
        } catch (err) { showErrorModal("Bulk Upload Failed", err.message); } 
        finally { setUploading(false); }
    };

    
    const downloadSampleFile = () => {
        const csvContent = "company_name,domain\n";
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "lead_targets_sample.csv");
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const handleAccordionToggle = async (target) => {
        if (editingTargetId === target.id) return;
        if (expandedTargetId === target.id) { 
            setExpandedTargetId(null); 
            setStagedContacts([]);
            return; 
        }
        setExpandedTargetId(target.id);
        
        if (target.status === 'Completed' && !contactsCache[target.id]) {
            try {
                const contacts = await API.fetchLeadContacts(target.id, user.access_token);
                
                setContactsCache(prev => ({ ...prev, [target.id]: contacts }));
            } catch (err) { console.error("Failed to load contacts:", err); }
        } else if (target.status === 'Awaiting Review') {
            // Load and safely parse current mapped contacts into state for manual editing
            const rawData = target.snovio_raw_data || {};
            const initialContacts = rawData.mapped_contacts || [];
            
            setStagedContacts(initialContacts);
        }
    };

        const startEditing = (e, target) => {
        e.stopPropagation();
        setEditingTargetId(target.id);
        setEditForm({ company_name: target.company_name, domain: target.domain });
    };

    const saveEdit = async (e, targetId) => {
        e.stopPropagation();
        try {
            await API.updateLeadTarget(targetId, editForm, user.access_token);
            setEditingTargetId(null);
            await loadTargets();
            setAlertMessage("✏️ Target updated."); setIsAlertOpen(true);
        } catch (err) { showErrorModal("Update Failed", err.message); }
    };

    const handleDelete = async (e, targetId) => {
        if (user.role === 'Sales Representative'){
            e.stopPropagation();
            if (!window.confirm("Are you sure you want to remove this target from the pipeline?")) return;
            try {
                await API.deactivateLeadTarget(targetId, user.access_token);
                await loadTargets();
                setAlertMessage("🗑️ Target removed."); setIsAlertOpen(true);
            } catch (err) { showErrorModal("Delete Failed", err.message); }
        }
        else if(user.role === 'Chief Full Stack Developer' || user.role === 'Admin'){
            e.stopPropagation();
            if (!window.confirm(`As an Admin, please know that this is paid data and you are permanently deleting this company record. Are you sure you want to proceed?`)) return;
            try {
                await API.deleteLeadTarget(targetId, user.access_token);
                await loadTargets();
                setAlertMessage("🗑️ Target removed."); setIsAlertOpen(true);
            } catch (err) { showErrorModal("Delete Failed", err.message); }
        }
    };

    const handleMockSync = async (e, targetId) => {
        e.stopPropagation();
        try {
            await API.simulateOvernightSync(targetId, user.access_token);
            await loadTargets();
            setAlertMessage("🔄 Mock overnight sync completed. Contacts generated."); setIsAlertOpen(true);
        } catch (err) { showErrorModal("Simulation Failed", err.message); }
    };

    return {companyName, setCompanyName, domain, setDomain, targets, expandedTargetId, setExpandedTargetId,
        contactsCache, statusFilter, setStatusFilter, file, setFile, isLoading, uploading, editingTargetId,
        editForm, setEditForm, loadTargets, handleTargetSubmit, handleBulkUpload, downloadSampleFile, handleAccordionToggle,
        startEditing, saveEdit, handleDelete, handleMockSync, stagedContacts, setStagedContacts,
    }
}