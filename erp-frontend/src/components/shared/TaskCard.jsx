import React from "react";
export default function TaskCard({task, viewTab, expandedTaskId, setExpandedTaskId,  state}) {
    const getUserName = (email) => {
        const userMatch = state.systemUsers?.find(u => u.email === email);
        return userMatch ? userMatch.name : email; // Fallback to email if name not found
    };
    
    const formatDateTime = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        const pad = (n) => n.toString().padStart(2, '0');
        
        const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
        const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        return `${date}-${time}`;
    };

    return (
        <div key={task.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', alignItems: 'center' }}>
                <div onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} style={{ cursor: 'pointer', flexGrow: 1 }}>
                   <strong style={{ textDecoration: task.is_incomplete ? 'none' : 'line-through', opacity: task.is_incomplete ? 1 : 0.6, fontSize: '15px' }}>{task.title}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {viewTab === 'received' ? `Assigned by: ${getUserName(task.assigned_by)}` : `Assigned to: ${task.assigned_to.map(getUserName).join(', ')}`}
                        </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* NEW: Download button for attachments */}
                    {task.attachment_url && (
                        <a href={task.attachment_url} download className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={(e) => e.stopPropagation()} // Prevent card from expanding when clicking download
                        >
                            📎 Download
                        </a>
                    )}

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', background: 'var(--bg-main)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <span>Status: <strong style={{ color: task.is_incomplete ? 'var(--brand-danger)' : 'var(--brand-success)' }}>{task.is_incomplete ? 'Pending' : 'Done'}</strong></span>
                        <input type="checkbox" checked={task.is_incomplete} onChange={() => state.handleToggleTask(task.id)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    </label>
                </div>
            </div>
            {expandedTaskId === task.id && (
                <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-main)', fontSize: '13px', color: 'var(--text-primary)' }}>
                    <p style={{ margin: '0 0 15px 0', lineHeight: 1.6 }}>{task.details}</p>
                    
                    {/* Timestamp Details Block */}
                    <div style={{ display: 'flex', gap: '20px', padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            <strong>Created:</strong> <br/>{formatDateTime(task.created_at)}
                        </div>
                        
                        {task.deadline && (
                            <div style={{ fontSize: '11px', color: 'var(--brand-accent)' }}>
                                <strong>Deadline:</strong> <br/>{formatDateTime(task.deadline)}
                            </div>
                        )}
                        
                        {task.completed_at && !task.is_incomplete && (
                            <div style={{ fontSize: '11px', color: 'var(--brand-success)' }}>
                                <strong>Completed:</strong> <br/>{formatDateTime(task.completed_at)}
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
};