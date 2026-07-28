import { useState } from "react";
import API from "../../api/api";

export default function useLeadStaging({companyName, setCompanyName, domain, setDomain, targets, expandedTargetId, setExpandedTargetId,
        contactsCache, statusFilter, setStatusFilter, file, setFile, isLoading, uploading, editingTargetId,
        editForm, setEditForm, loadTargets, handleTargetSubmit, handleBulkUpload, downloadSampleFile, handleAccordionToggle,
        startEditing, saveEdit, handleDelete, handleMockSync, user, setAlertMessage, setIsAlertOpen, showErrorModal, stagedContacts, setStagedContacts}){
    
    const updateStagedContactField = (index, field, value) => {
        const updated = [...stagedContacts];
        updated[index][field] = value;
        setStagedContacts(updated);
    };

    const addStagedContactRow = () => {
        setStagedContacts(prev => [
            ...prev,
            { full_name: "", designation: "", email: "", is_priority: false }
        ]);
    };

    const removeStagedContactRow = (index) => {
        setStagedContacts(prev => prev.filter((_, i) => i !== index));
    };

    const handleApproveStaging = async (targetId) => {
        // Validate at least one contact is fully mapped
        const validContacts = stagedContacts.filter(c => c.full_name.trim() && c.email.trim());
        if (validContacts.length === 0) {
            showErrorModal("Mapping Validation", "Please map at least one contact with a name and email before approving.");
            return;
        }

        try {
            // Re-uses your API path to commit the approved payload
            await fetch(`/api/v1/lead-engine/targets/${targetId}/approve-staging`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.access_token}`
                },
                body: JSON.stringify({ contacts: validContacts })
            });
            setAlertMessage("🏆 Lead contacts verified and stored in database.");
            setIsAlertOpen(true);
            setExpandedTargetId(null);
            setStagedContacts([]);
            await loadTargets();
        } catch (err) {
            showErrorModal("Approval Error", err.message);
        }
    };

    const handleRejectStaging = async(targetId) => {
        const reason = window.prompt("Reason for rejection(optional):");
        if(!window.confirm("Reject this harvested data?")) return;

        try{
            await API.rejectSnovioStaging(targetId, {reason}, user.access_token);
            setAlertMessage("❌ Harvest rejected.")
            setIsAlertOpen(true);

            setExpandedTargetId(null);
            setStagedContacts([]);

            await loadTargets();
        }
        catch(err){
            showErrorModal("Reject failed", err.message);
        }
    }
    return {stagedContacts, updateStagedContactField, addStagedContactRow, removeStagedContactRow, handleApproveStaging, handleRejectStaging};
    
}