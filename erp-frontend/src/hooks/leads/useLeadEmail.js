import { useState } from "react";
import API from "../../api/api";

export default function useLeaedEmail({itemsMaster, user, setAlertMessage, setIsAlertOpen, showErrorModal}){
    const [emailModal, setEmailModal] = useState({ isOpen: false, contact: null, target: null });
    const [selectedProductCode, setSelectedProductCode] = useState("");
    const [draftSubject, setDraftSubject] = useState("");
    const [draftBody, setDraftBody] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [attachments, setAttachments] = useState([]);

    const openEmailModal = (contact, target) => {
        setEmailModal({ isOpen: true, contact, target });
        setDraftSubject("");
        setDraftBody("");
        setFeedback("");
        setSelectedProductCode("");
        setAttachments([]);
    };

    const closeEmailModal = () => {
        setEmailModal({ isOpen: false, contact: null, target: null });
    };

    
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + attachments.length > 5) {
            showErrorModal("Limit Exceeded", "You can only attach a maximum of 5 files.");
            return;
        }
        setAttachments(prev => [...prev, ...files]);
    };

    const removeAttachment = (idx) => {
        setAttachments(prev => prev.filter((_, i) => i !== idx));
    };

    
    const generateEmail = async (isRewrite = false) => {
        if (!selectedProductCode && !isRewrite) {
            showErrorModal("Selection Required", "Please select a product from the catalog to feature in this email.");
            return;
        }

        const product = itemsMaster?.find(i => i.item_code === selectedProductCode);
        
        setIsGenerating(true);
        try {
            const payload = {
                contact_name: emailModal.contact.full_name,
                designation: emailModal.contact.designation,
                company_name: emailModal.target.company_name,
                item_name: product?.item_name || selectedProductCode,
                item_specs: product?.additional_spec_text || "Standard laboratory equipment specifications.",
                feedback: isRewrite ? feedback : null,
                previous_draft: isRewrite ? draftBody : null
            };

            const response = await API.generateLeadEmail(payload, user.access_token);
            setDraftSubject(response.subject);
            setDraftBody(response.body);
            if (isRewrite) setFeedback(""); // Clear feedback after successful rewrite
            
        } catch (err) {
            showErrorModal("AI Generation Failed", err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendYahoo = () => {
        if (!draftSubject || !draftBody) return;
    
        const encodedSubject = encodeURIComponent(draftSubject);
        const encodedBody = encodeURIComponent(draftBody);
        const yahooUrl = `https://compose.mail.yahoo.com/?to=${emailModal.contact.email}&subj=${encodedSubject}&body=${encodedBody}`;
            
        window.open(yahooUrl, "_blank");
    
        if (attachments.length > 0) {
            setAlertMessage(`⚠️ Yahoo Mail opened in a new tab. Because web browsers block automatic file transfers for security, please manually drag and drop your ${attachments.length} attached files into the Yahoo window.`);
            setIsAlertOpen(true);
        }
          
        closeEmailModal();
    };
    
    return {emailModal, selectedProductCode, setSelectedProductCode, draftSubject, setDraftSubject, draftBody,
        setDraftBody, feedback, setFeedback, isGenerating, attachments, openEmailModal, closeEmailModal, handleFileChange,
        removeAttachment, generateEmail, handleSendYahoo
    };
}