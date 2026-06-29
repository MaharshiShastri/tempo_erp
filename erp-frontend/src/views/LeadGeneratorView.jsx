import React, { useState, useEffect } from "react";
import API from "../api/api";
import { FiMail, FiRefreshCw, FiSend, FiPaperclip } from "react-icons/fi";

export default function LeadGeneratorView({ state }) {
    const [companyName, setCompanyName] = useState("");
    const [domain, setDomain] = useState("");
    const [targets, setTargets] = useState([]);
    const [expandedTargetId, setExpandedTargetId] = useState(null);
    const [contactsCache, setContactsCache] = useState({});
    
    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    // Editing States
    const [editingTargetId, setEditingTargetId] = useState(null);
    const [editForm, setEditForm] = useState({ company_name: "", domain: "" });

    const [emailModal, setEmailModal] = useState({ isOpen: false, contact: null, target: null });
    const [selectedProductCode, setSelectedProductCode] = useState("");
    const [draftSubject, setDraftSubject] = useState("");
    const [draftBody, setDraftBody] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [attachments, setAttachments] = useState([]);

    const isBulkMode = !!file;

    useEffect(() => { loadTargets(); }, []);

    const loadTargets = async () => {
        try {
            const data = await API.fetchLeadTargets(state.user.access_token);
            setTargets(data);
        } catch (err) { state.showErrorModal("Fetch Error", err.message); }
    };

    const handleTargetSubmit = async (e) => {
        e.preventDefault();
        if (file) {
            state.showErrorModal("Validation Error", "Please use 'Upload Excel' for bulk input. Clear file to use manual entry.");
            return;
        }
        if (!companyName.trim()) {
            state.showErrorModal("Validation Error", "Please enter both company name and valid domain.");
            return;
        }
        setIsLoading(true);
        try {
            await API.submitLeadTarget({ company_name: companyName, domain }, state.user.access_token);
            setCompanyName(""); setDomain("");
            await loadTargets();
            if (state.setAlertMessage) {
                state.setAlertMessage("✅ Target queued.");
                state.setIsAlertOpen(true);
            }
        } catch (err) { state.showErrorModal("Submission Failed", err.message); } 
        finally { setIsLoading(false); }
    };

    const handleBulkUpload = async () => {
        if (!file) return state.showErrorModal("Validation Error", "Please select an Excel/CSV file.");
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            await API.bulkUploadLeadTargets(formData, state.user.access_token);
            setFile(null);
            await loadTargets();
            state.setAlertMessage("📊 Bulk upload successful. Targets queued.");
            state.setIsAlertOpen(true);
        } catch (err) { state.showErrorModal("Bulk Upload Failed", err.message); } 
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
        if (editingTargetId === target.id) return; // Prevent toggle while editing
        if (expandedTargetId === target.id) { setExpandedTargetId(null); return; }
        setExpandedTargetId(target.id);
        if (target.status === 'Completed' && !contactsCache[target.id]) {
            try {
                const contacts = await API.fetchLeadContacts(target.id, state.user.access_token);
                setContactsCache(prev => ({ ...prev, [target.id]: contacts }));
            } catch (err) { console.error("Failed to load contacts:", err); }
        }
    };

    // --- CRUD Handlers ---
    const startEditing = (e, target) => {
        e.stopPropagation();
        setEditingTargetId(target.id);
        setEditForm({ company_name: target.company_name, domain: target.domain });
    };

    const saveEdit = async (e, targetId) => {
        e.stopPropagation();
        try {
            await API.updateLeadTarget(targetId, editForm, state.user.access_token);
            setEditingTargetId(null);
            await loadTargets();
            state.setAlertMessage("✏️ Target updated."); state.setIsAlertOpen(true);
        } catch (err) { state.showErrorModal("Update Failed", err.message); }
    };

    const handleDelete = async (e, targetId) => {
        if (state.user.role === 'Sales Representative'){
            e.stopPropagation();
            if (!window.confirm("Are you sure you want to remove this target from the pipeline?")) return;
            try {
                await API.deactivateLeadTarget(targetId, state.user.access_token);
                await loadTargets();
                state.setAlertMessage("🗑️ Target removed."); state.setIsAlertOpen(true);
            } catch (err) { state.showErrorModal("Delete Failed", err.message); }
        }
        else if(state.user.role === 'Chief Full Stack Developer' || state.user.role === 'Admin'){
            e.stopPropagation();
            if (!window.confirm(`As an Admin, please know that this is a paid data and you are permanently deleting this company record,
                so please be sure to delete this data. Are you sure you want to remove this target from the pipeline?`)) return;
            try {
                await API.deleteLeadTarget(targetId, state.user.access_token);
                await loadTargets();
                state.setAlertMessage("🗑️ Target removed."); state.setIsAlertOpen(true);
            } catch (err) { state.showErrorModal("Delete Failed", err.message); }
        }
    };

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
            state.showErrorModal("Limit Exceeded", "You can only attach a maximum of 5 files.");
            return;
        }
        setAttachments(prev => [...prev, ...files]);
    };

    const removeAttachment = (idx) => {
        setAttachments(prev => prev.filter((_, i) => i !== idx));
    };

    const generateEmail = async (isRewrite = false) => {
        if (!selectedProductCode && !isRewrite) {
            state.showErrorModal("Selection Required", "Please select a product from the catalog to feature in this email.");
            return;
        }

        const product = state.itemsMaster.find(i => i.item_code === selectedProductCode);
        
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

            const response = await API.generateLeadEmail(payload, state.user.access_token);
            setDraftSubject(response.subject);
            setDraftBody(response.body);
            if (isRewrite) setFeedback(""); // Clear feedback after successful rewrite
            
        } catch (err) {
            state.showErrorModal("AI Generation Failed", err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendYahoo = () => {
        if (!draftSubject || !draftBody) return;

        // Construct Yahoo Compose URL
        const encodedSubject = encodeURIComponent(draftSubject);
        const encodedBody = encodeURIComponent(draftBody);
        const yahooUrl = `https://compose.mail.yahoo.com/?to=${emailModal.contact.email}&subj=${encodedSubject}&body=${encodedBody}`;
        
        window.open(yahooUrl, "_blank");

        if (attachments.length > 0) {
            state.setAlertMessage(`⚠️ Yahoo Mail opened in a new tab. Because web browsers block automatic file transfers for security, please manually drag and drop your ${attachments.length} attached files into the Yahoo window.`);
            state.setIsAlertOpen(true);
        }
        
        closeEmailModal();
    };

    const handleMockSync = async (e, targetId) => {
        e.stopPropagation();
        try {
            await API.simulateOvernightSync(targetId, state.user.access_token);
            await loadTargets();
            state.setAlertMessage("🔄 Mock overnight sync completed. Contacts generated."); state.setIsAlertOpen(true);
        } catch (err) { state.showErrorModal("Simulation Failed", err.message); }
    };

    return (
        <div className="frappe-card" style={{ maxWidth: 1000, margin: "0 auto", padding: 25 }}>
        {emailModal.isOpen && (
                <div className="modal-overlay" onClick={closeEmailModal}>
                    <div className="modal-box" style={{ maxWidth: '800px', width: '90%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ background: 'var(--brand-accent)', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><FiMail /> AI Cold Outreach Drafter</h3>
                            <button className="btn-text" style={{ color: '#fff', fontSize: '18px', padding: 0 }} onClick={closeEmailModal}>✕</button>
                        </div>

                        <div style={{ padding: '20px', overflowY: 'auto', flexGrow: 1 }}>
                            
                            {/* Contact Context */}
                            <div style={{ background: 'var(--bg-main)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Context</div>
                                <strong>{emailModal.contact.full_name}</strong> - {emailModal.contact.designation} @ {emailModal.target.company_name}
                                <div style={{ color: 'var(--brand-accent)', fontSize: '13px', marginTop: '4px' }}>{emailModal.contact.email}</div>
                            </div>

                            {/* Catalog Selection & Attachments */}
                            <div className="form-grid-layout" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: '20px' }}>
                                <div className="form-group">
                                    <label className="input-label">Feature Product from Catalog</label>
                                    <select className="form-select-native" value={selectedProductCode} onChange={e => setSelectedProductCode(e.target.value)}>
                                        <option value="">-- Select Product Context --</option>
                                        {(state.itemsMaster || []).map(item => (
                                            <option key={item.item_code} value={item.item_code}>{item.item_code} - {item.item_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="input-label">Attachments ({attachments.length}/5)</label>
                                    <label className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
                                        <FiPaperclip style={{ marginRight: '6px' }}/> Add Files
                                        <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" style={{ display: 'none' }} onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>

                            {/* Display Attachment Names */}
                            {attachments.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                                    {attachments.map((file, idx) => (
                                        <span key={idx} style={{ fontSize: '11px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {file.name}
                                            <span style={{ color: 'var(--brand-danger)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => removeAttachment(idx)}>✕</span>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Generate Button (Initial) */}
                            {!draftBody && (
                                <button className="btn btn-primary" onClick={() => generateEmail(false)} disabled={isGenerating || !selectedProductCode} style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                    {isGenerating ? "🧠 AI is drafting..." : "✨ Generate Intelligent Draft"}
                                </button>
                            )}

                            {/* Draft Editor & Rewrite Feedback */}
                            {draftBody && (
                                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '10px' }}>
                                    <div className="form-group">
                                        <label className="input-label">Subject Line</label>
                                        <input className="form-input" value={draftSubject} onChange={e => setDraftSubject(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label">Email Body (Human Edits Allowed)</label>
                                        <textarea className="form-input" rows={8} value={draftBody} onChange={e => setDraftBody(e.target.value)} style={{ lineHeight: '1.5', fontFamily: 'sans-serif' }} />
                                    </div>
                                    
                                    <div style={{ background: '#f8f4ff', border: '1px solid #dcd0ff', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
                                        <label className="input-label" style={{ color: '#5e35b1' }}>AI Human-in-the-loop Rewrite</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input 
                                                className="form-input" 
                                                placeholder="e.g. Make it shorter, change tone to highly formal, remove the question at the end..." 
                                                value={feedback} 
                                                onChange={e => setFeedback(e.target.value)} 
                                                style={{ background: '#fff' }}
                                            />
                                            <button className="btn btn-secondary" onClick={() => generateEmail(true)} disabled={isGenerating || !feedback} style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FiRefreshCw /> {isGenerating ? "Rewriting..." : "Rewrite"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / Send Action */}
                        <div style={{ padding: '15px 20px', background: 'var(--bg-main)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn btn-secondary" onClick={closeEmailModal}>Discard</button>
                            <button className="btn btn-success" onClick={handleSendYahoo} disabled={!draftBody || isGenerating} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px' }}>
                                <FiSend /> Open in Yahoo Business
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="system-header" style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Lead Generator Engine</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Target enterprise domains during the day; harvest prioritized contacts overnight.
                </p>
            </div>

            <form onSubmit={handleTargetSubmit} style={{ background: "var(--bg-main)", padding: "20px", borderRadius: "var(--radius-sm)", marginBottom: "30px", border: "1px solid var(--border-light)" }}>
                <h4 style={{ margin: "0 0 15px 0", fontSize: "14px" }}>Queue New Corporate Target</h4>
                <div className="form-grid-layout" style={{ gridTemplateColumns: "2fr 2fr auto", alignItems: "end" }}>
                    <div className="form-group">
                        <label className="input-label">Company Name *</label>
                        <input type="text" required className="form-input" placeholder="e.g. Tata Motors" value={companyName} onChange={e => setCompanyName(e.target.value)} disabled={isBulkMode}/>
                    </div>
                    <div className="form-group">
                        <label className="input-label">Corporate Domain *</label>
                        <input type="text" required className="form-input" placeholder="e.g. tatamotors.com" value={domain} onChange={e => setDomain(e.target.value)} disabled={isBulkMode}/>
                    </div>
                    <div className="form-group">
                        <label className="input-label">Upload Excel (Bulk Targets)</label>
                        <input type="file" accept=".xlsx,.xls,.csv" className="form-input" onChange={(e) => {setFile(e.target.files[0]); setCompanyName(""); setDomain("");}}/>
                    </div>
                    <button type="button" onClick={handleBulkUpload} className="btn btn-secondary" disabled={uploading || !file} style={{background: "var(--bg-main)", justifyContent: "center", alignItems: "center"}}>
                        {uploading ? "Uploading..." : "Upload Excel"}
                    </button>
                    <button type="submit" disabled={isLoading || isBulkMode} className="btn btn-primary" style={{ padding: "10px 20px", justifyContent: "center", alignItems: "center"}}>
                        {isLoading ? "Queueing..." : "Add to Night Queue"}
                    </button>
                    <button type="button" onClick={downloadSampleFile} className="btn btn-text" style={{fontSize: "12px", whiteSpace: "nowrap"}}>⬇ Download Sample</button>
                </div>
            </form>

            <div>
                <h4 style={{ margin: "0 0 15px 0", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>Scraping Pipeline</h4>
                {targets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px dashed var(--border-light)' }}>
                        No targets currently in the pipeline.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {targets.map(target => {
                            const isExpanded = expandedTargetId === target.id;
                            const isEditing = editingTargetId === target.id;
                            const contacts = contactsCache[target.id] || [];

                            return (
                                <div key={target.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', overflow: 'hidden' }}>
                                    
                                    {/* Accordion Header */}
                                    <div onClick={() => handleAccordionToggle(target)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', cursor: isEditing ? 'default' : 'pointer', background: isExpanded ? 'var(--bg-main)' : 'transparent' }}>
                                        
                                        {/* Left Side: Info or Edit Inputs */}
                                        <div style={{ flexGrow: 1, marginRight: '20px' }}>
                                            {isEditing ? (
                                                <div style={{ display: 'flex', gap: '10px' }} onClick={e => e.stopPropagation()}>
                                                    <input className="form-input" style={{ padding: '4px 8px', fontSize: '13px' }} value={editForm.company_name} onChange={e => setEditForm({...editForm, company_name: e.target.value})} />
                                                    <input className="form-input" style={{ padding: '4px 8px', fontSize: '13px' }} value={editForm.domain} onChange={e => setEditForm({...editForm, domain: e.target.value})} />
                                                </div>
                                            ) : (
                                                <>
                                                    <strong style={{ fontSize: '15px', color: 'var(--brand-accent)' }}>{target.company_name}</strong>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                        {target.domain} | Queued: {target.created_at.split('T')[0]} | By: {target.requested_by.split('@')[0]}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        
                                        {state.user.role === state.user.role === 'Chief Full Stack Developer' || state.user.role === 'Admin' && (
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>{state.user.email == target.requested_by ? state.user.name : target.requested_by.split('@')[0]}</span>
                                        )}

                                        {/* Right Side: Actions */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            {isEditing ? (
                                                <>
                                                    <button onClick={(e) => saveEdit(e, target.id)} className="btn btn-success" style={{ padding: '4px 8px', fontSize: '11px' }}>Save</button>
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingTargetId(null); }} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>Cancel</button>
                                                </>
                                            ) : (
                                                <>
                                                    <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', background: target.status === 'Completed' ? '#eaffea' : 'var(--bg-main)', color: target.status === 'Completed' ? 'var(--brand-success)' : 'var(--text-muted)', border: `1px solid ${target.status === 'Completed' ? 'var(--brand-success)' : 'var(--border-light)'}`}}>
                                                        {target.status === 'Completed' ? '✅ Harvested' : '⏳ Pending Night Sync'}
                                                    </span>
                                                    
                                                    {/* CRUD Actions */}
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={(e) => startEditing(e, target)} className="btn-text" style={{ fontSize: '12px', padding: 0 }}>✏️</button>
                                                        <button onClick={(e) => handleDelete(e, target.id)} className="btn-text-danger" style={{ fontSize: '12px', padding: 0 }}>🗑️</button>
                                                    </div>

                                                    {target.status === 'Pending' && (
                                                        <button onClick={(e) => handleMockSync(e, target.id)} className="btn-text" style={{ fontSize: '11px' }}>[Force Sync]</button>
                                                    )}
                                                    
                                                    <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--text-muted)' }}>▼</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Accordion Body */}
                                    {isExpanded && target.status === 'Completed' && (
                                        <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)' }}>
                                            {contacts.length === 0 ? (
                                                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No contacts found for this domain.</div>
                                            ) : (
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                    <thead>
                                                        <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                                                            <th style={{ padding: '8px' }}>Executive Name</th>
                                                            <th style={{ padding: '8px' }}>Designation</th>
                                                            <th style={{ padding: '8px' }}>Contact Email</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {contacts.map((c, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: c.is_priority ? 'var(--brand-success)' : 'var(--brand-danger)' }}>
                                                                <td style={{ padding: '10px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <strong>{c.full_name}</strong>
                                                                        {c.is_priority && <span style={{ fontSize: '10px', background: 'var(--brand-accent)', color: 'var(--text-primary)', padding: '2px 6px', borderRadius: '4px' }}>HIGH PRIORITY</span>}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '10px' }}>{c.designation}</td>
                                                                <td style={{ padding: '10px', color: 'var(--brand-accent)' }}>{c.email}</td>
                                                                <td style={{ padding: '10px', textAlign: 'right' }}><button className="btn btn-secondary" onClick={() => openEmailModal(c, target)} style={{ fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FiMail /> Draft Email</button></td>
                                                                <div style={{ display: 'flex', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden', marginRight: '10px' }}>
                                                                   <button className={`btn ${c.email_status === 'Sent Email' ? 'btn-primary' : 'btn-text'}`} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: 0, borderRight: '1px solid var(--border-light)' }}onClick={() => updateContactStatus(c.id, 'Sent Email')}>Sent</button>
                                                                   <button className={`btn ${c.email_status === 'Got Reply' ? 'btn-secondary' : 'btn-text'}`} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: 0, borderRight: '1px solid var(--border-light)', background: c.email_status === 'Got Reply' ? '#fff8f0' : 'transparent', color: c.email_status === 'Got Reply' ? '#e67e22' : 'var(--text-muted)' }} onClick={() => updateContactStatus(c.id, 'Got Reply')}>Replied</button>
                                                                   <button className={`btn ${c.email_status === 'Closed Enquiry' ? 'btn-success' : 'btn-text'}`} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: 0 }}onClick={() => updateContactStatus(c.id, 'Closed Enquiry')}>Closed</button>
                                                                </div>
                                                                
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}
                                    {isExpanded && target.status === 'Pending' && (
                                        <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                                            The scraper engine will search for contacts matching this domain during the overnight batch process. Check back tomorrow morning.
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}