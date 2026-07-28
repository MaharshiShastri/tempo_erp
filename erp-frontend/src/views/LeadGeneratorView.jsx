import React, { useState, useEffect } from "react";
import API from "../api/api";
import { FiMail, FiRefreshCw, FiSend, FiPaperclip, FiFilter, FiCheck, FiPlus, FiTrash2, FiUserCheck } from "react-icons/fi";

export default function LeadGeneratorView({ state }) {
    const {companyName, setCompanyName, domain, setDomain, targets, expandedTargetId, 
        contactsCache, statusFilter, setStatusFilter, file, setFile, editingTargetId, editForm, setEditForm,
        isLoading, uploading, handleTargetSubmit, handleBulkUpload, downloadSampleFile, handleAccordionToggle,
        startEditing, saveEdit, handleDelete, handleMockSync, stagedContacts, updateStagedContactField, addStagedContactRow,
        removeStagedContactRow, handleApproveStaging, handleRejectStaging, emailModal, selectedProductCode, setSelectedProductCode,
        draftSubject, setDraftSubject, draftBody, setDraftBody, feedback, setFeedback, attachments, isGenerating,
        openEmailModal, closeEmailModal, handleFileChange, removeAttachment, generateEmail, handleSendYahoo
    } = state;
    
    const isBulkMode = !!file;
    
        
    // Filter pipeline list dynamically by state selection
    const filteredTargets = targets.filter(target => {
        if (statusFilter === "all") return true;
        return target.status === statusFilter;
    });

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
                                        {(state.itemsMaster || [])?.map(item => (
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
                            {attachments?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                                    {attachments?.map((file, idx) => (
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
                {/* PIPELINE FILTER COMPONENT */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "15px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
                    <h4 style={{ margin: 0 }}>Scraping Pipeline</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiFilter style={{ color: 'var(--text-muted)' }} />
                        <select className="form-select-native" style={{ fontSize: '12px', padding: '4px 8px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">🔍 Show All Statuses</option>
                            <option value="Pending">⏳ Pending Sync</option>
                            <option value="Awaiting Review">✍️ Awaiting Review</option>
                            <option value="Completed">✅ Completed</option>
                            <option value="Failed">❌ Failed</option>
                            <option value="Rejected">🚫 Rejected</option>
                        </select>
                    </div>
                </div>

                {(filteredTargets ?? []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px dashed var(--border-light)' }}>
                        No targets match the selected status filter.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredTargets?.map(target => {
                            const isExpanded = expandedTargetId === target.id;
                            const isEditing = editingTargetId === target.id;
                            const contacts = contactsCache[target.id] || [];
                            const rawEmails = target.snovio_raw_data?.raw_emails || [];

                            return (
                                <div key={target.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', overflow: 'hidden' }}>
                                    
                                    {/* Accordion Header */}
                                    <div onClick={() => handleAccordionToggle(target)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', cursor: isEditing ? 'default' : 'pointer', background: isExpanded ? 'var(--bg-main)' : 'transparent' }}>
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
                                                        {target.domain} | Queued: {target.created_at?.split('T')[0]} | By: {target.requested_by?.split('@')[0]}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        
                                        {/* Right Side Status & Controls */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span style={{ 
                                                fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', 
                                                background: target.status === 'Completed' ? '#eaffea' : (target.status === 'Awaiting Review' ? '#fff8f0' : (target.status === "Rejected" ? '#ffe8e8' : 'var(--bg-main)')), 
                                                color: target.status === 'Completed' ? 'var(--brand-success)' : (target.status === 'Awaiting Review' ? '#e67e22' : (target.status === 'Rejected' ? '#c62828' : 'var(--text-muted)')),
                                                border: `1px solid ${target.status === 'Completed' ? 'var(--brand-success)' : (target.status === 'Awaiting Review' ? '#ffebcc' : 'var(--border-light)')}`
                                            }}>
                                                {target.status === 'Completed' ? '✅ Completed' : (target.status === 'Awaiting Review' ? '✍️ Awaiting Review' : (target.status === 'Rejected' ? '🚫 Rejected' : '⏳ Pending'))}
                                            </span>
                                            
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={(e)=>handleRejectStaging(target.id)} className="btn-text" style={{fontSize: '12px', padding: 0}}>🚫</button>
                                                <button onClick={(e) => startEditing(e, target)} className="btn-text" style={{ fontSize: '12px', padding: 0 }}>✏️</button>
                                                <button onClick={(e) => handleDelete(e, target.id)} className="btn-text-danger" style={{ fontSize: '12px', padding: 0 }}>🗑️</button>
                                            </div>

                                            {target.status === 'Pending' && (
                                                <button onClick={(e) => handleMockSync(e, target.id)} className="btn-text" style={{ fontSize: '11px' }}>[Force Sync]</button>
                                            )}
                                            
                                            <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--text-muted)' }}>▼</span>
                                        </div>
                                    </div>

                                    {/* AWAITING MANUAL REVIEW WORKSPACE */}
                                    {isExpanded && target.status === 'Awaiting Review' && (
                                        <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)', background: '#fffcf5' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                <h4 style={{ margin: 0, color: '#b25900' }}>Review & Map Harvested Leads</h4>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn btn-secondary" onClick={addStagedContactRow}>+ Add Contact Row</button>
                                                    <button className="btn btn-success" onClick={() => handleApproveStaging(target.id)}><FiUserCheck /> Approve & Import</button>
                                                    <button className="btn btn-text-danger" onClick={() => handleRejectStaging(target.id)}>Reject</button>
                                                </div>
                                            </div>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                <thead>
                                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                                                        <th style={{ padding: '8px' }}>Name</th>
                                                        <th style={{ padding: '8px' }}>Designation</th>
                                                        <th style={{ padding: '8px' }}>Matched Email (Dropdown / Custom Override)</th>
                                                        <th style={{ padding: '8px', textAlign: 'center' }}>Priority</th>
                                                        <th style={{ padding: '8px', textAlign: 'center' }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stagedContacts?.map((c, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                            <td style={{ padding: '8px' }}>
                                                                <input type="text" className="form-input" style={{ padding: '4px', fontSize: '13px' }} value={c.full_name} onChange={e => updateStagedContactField(idx, 'full_name', e.target.value)} />
                                                            </td>
                                                            <td style={{ padding: '8px' }}>
                                                                <input type="text" className="form-input" style={{ padding: '4px', fontSize: '13px' }} value={c.designation} onChange={e => updateStagedContactField(idx, 'designation', e.target.value)} />
                                                            </td>
                                                            <td style={{ padding: '8px' }}>
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <select className="form-select-native" style={{ fontSize: '12px', padding: '4px' }} value={c.email || ""} onChange={e => updateStagedContactField(idx, 'email', e.target.value)}>
                                                                        <option value="">-- No Email --</option>
                                                                        {rawEmails?.map((email, i) => (
                                                                            <option key={i} value={email}>{email}</option>
                                                                        ))}
                                                                    </select>
                                                                    <input type="text" className="form-input" placeholder="Or type manually..." style={{ padding: '4px', fontSize: '12px' }} value={c.email} onChange={e => updateStagedContactField(idx, 'email', e.target.value)} />
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                                <input type="checkbox" checked={c.is_priority} onChange={e => updateStagedContactField(idx, 'is_priority', e.target.checked)} />
                                                            </td>
                                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                                <button className="btn-text-danger" onClick={() => removeStagedContactRow(idx)}><FiTrash2 /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    
                                                    {(stagedContacts ?? []).length === 0 && (
                                                        <tr>
                                                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                                                No contacts loaded. Use "Add Contact Row" to populate details manually.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* COMPLETED VIEW */}
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
                                                            <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {contacts?.map((c, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)'}}>
                                                                <td style={{ padding: '10px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <strong>{c.full_name}</strong>
                                                                        {c.is_priority && <span style={{ fontSize: '10px', background: 'var(--brand-accent)', color: 'var(--text-primary)', padding: '2px 6px', borderRadius: '4px' }}>HIGH PRIORITY</span>}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '10px' }}>{c.designation}</td>
                                                                <td style={{ padding: '10px', color: 'var(--brand-accent)' }}>{c.email}</td>
                                                                <td style={{ padding: '10px', textAlign: 'right' }}><button className="btn btn-secondary" onClick={() => openEmailModal(c, target)} style={{ fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FiMail /> Draft Email</button></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}

                                    {/* PENDING VIEW */}
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