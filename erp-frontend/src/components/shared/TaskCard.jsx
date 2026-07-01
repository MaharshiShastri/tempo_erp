import React, { useState } from "react";
import API from "../../api/api";
import { FiEdit2, FiTrash2, FiSave, FiX } from "react-icons/fi";

export default function TaskCard({task, viewTab, expandedTaskId, setExpandedTaskId, handleFileAction, state}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: task.title, details: task.details, deadline: task.deadline || '' });

    const getUserName = (email) => {
        const userMatch = state.systemUsers?.find(u => u.email === email);
        return userMatch ? userMatch.name : email; 
    };
    
    const formatDateTime = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const getDisplayFileName = (path) => {
        if (!path) return "";
        const baseName = path.split(/[\\/]/).pop();
        return baseName.substring(baseName.indexOf('_') + 1) || baseName;
    };

    const canEditOrDelete = state.user.email === task.assigned_by || state.user.role === 'Admin' || state.user.role === 'Chief Full Stack Developer';

    const handleUpdate = async (e) => {
        e.stopPropagation();
        try {
            await API.updateTask(task.id, editForm, state.user.access_token);
            state.setAlertMessage("✅ Task updated successfully.");
            state.setIsAlertOpen(true);
            setIsEditing(false);
            // Trigger refresh via the parent hook
            if (state.refreshDataHub) state.refreshDataHub();
        } catch (err) { state.showErrorModal("Update Failed", err.message); }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to permanently delete this task?")) return;
        try {
            await API.deleteTask(task.id, state.user.access_token);
            state.setAlertMessage("🗑️ Task deleted.");
            state.setIsAlertOpen(true);
            if (state.refreshDataHub) state.refreshDataHub();
        } catch (err) { state.showErrorModal("Delete Failed", err.message); }
    };

    return (
        <div key={task.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', alignItems: 'center' }}>
                <div onClick={() => !isEditing && setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} style={{ cursor: isEditing ? 'default' : 'pointer', flexGrow: 1, marginRight: '15px' }}>
                    {isEditing ? (
                        <input className="form-input" style={{ fontSize: '15px', padding: '4px 8px', fontWeight: 'bold' }} value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} onClick={e => e.stopPropagation()} />
                    ) : (
                        <>
                            <strong style={{ textDecoration: task.is_incomplete ? 'none' : 'line-through', opacity: task.is_incomplete ? 1 : 0.6, fontSize: '15px' }}>{task.title}</strong>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {viewTab === 'received' ? `Assigned by: ${getUserName(task.assigned_by)}` : `Assigned to: ${task.assigned_to.map(getUserName).join(', ')}`}
                            </div>
                        </>
                    )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Attachment Button */}
                    {!isEditing && task.attachment_url && (
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={(e) => { e.stopPropagation(); handleFileAction(task.attachment_url); }} title={getDisplayFileName(task.attachment_url)}>
                            📎 {getDisplayFileName(task.attachment_url)}
                        </button>
                    )}

                    {/* Action Toolbar */}
                    {isEditing ? (
                        <>
                            <button className="btn btn-success" onClick={handleUpdate} style={{ padding: '6px 10px', fontSize: '12px' }}><FiSave /> Save</button>
                            <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} style={{ padding: '6px 10px', fontSize: '12px' }}><FiX /> Cancel</button>
                        </>
                    ) : (
                        <>
                            {canEditOrDelete && (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button className="btn-text" onClick={(e) => { e.stopPropagation(); setIsEditing(true); setExpandedTaskId(task.id); }} style={{ padding: '4px' }}><FiEdit2 /></button>
                                    <button className="btn-text-danger" onClick={handleDelete} style={{ padding: '4px' }}><FiTrash2 /></button>
                                    <button className="btn-text" title="Export to PDF" onClick={(e) => { e.stopPropagation();  API.downloadPdf(task.id, state.user.access_token); }} style={{ padding: '4px', color: 'var(--brand-accent)' }}>📄 Download PDF</button>
                                </div>
                            )}
                            <label onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', background: 'var(--bg-main)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                                <span>Status: <strong style={{ color: task.is_incomplete ? 'var(--brand-danger)' : 'var(--brand-success)' }}>{task.is_incomplete ? 'Pending' : 'Done'}</strong></span>
                                <input type="checkbox" checked={!task.is_incomplete} onChange={() => state.handleToggleTask(task.id)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                            </label>
                        </>
                    )}
                </div>
            </div>
            
            {/* Task Body / Details */}
            {expandedTaskId === task.id && (
                <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-main)', fontSize: '13px', color: 'var(--text-primary)' }}>
                    {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} onClick={e => e.stopPropagation()}>
                            <textarea className="form-input" rows={4} value={editForm.details} onChange={e => setEditForm({...editForm, details: e.target.value})} placeholder="Task details..." />
                            <div>
                                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deadline:</label>
                                <input type="datetime-local" className="form-input" style={{ width: 'fit-content' }} value={editForm.deadline} onChange={e => setEditForm({...editForm, deadline: e.target.value})} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <p style={{ margin: '0 0 15px 0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{task.details}</p>
                            <div style={{ display: 'flex', gap: '20px', padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}><strong>Created:</strong> <br/>{formatDateTime(task.created_at)}</div>
                                {task.deadline && <div style={{ fontSize: '11px', color: 'var(--brand-accent)' }}><strong>Deadline:</strong> <br/>{formatDateTime(task.deadline)}</div>}
                                {task.completed_at && !task.is_incomplete && <div style={{ fontSize: '11px', color: 'var(--brand-success)' }}><strong>Completed:</strong> <br/>{formatDateTime(task.completed_at)}</div>}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}