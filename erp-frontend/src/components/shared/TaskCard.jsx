import React from "react";
export default function TaskCard({task, viewTab, expandedTaskId, setExpandedTaskId,  state}) {
    return (
        <div key={task.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', alignItems: 'center' }}>
                <div onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} style={{ cursor: 'pointer', flexGrow: 1 }}>
                   <strong style={{ textDecoration: task.is_incomplete ? 'none' : 'line-through', opacity: task.is_incomplete ? 1 : 0.6, fontSize: '15px' }}>{task.title}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {viewTab === 'received' ? `Assigned by: ${task.assigned_by}` : `Assigned to: ${task.assigned_to.join(', ')}`}
                        </div>
                </div>
                <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', background: 'var(--bg-main)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <span>Status: <strong style={{ color: task.is_incomplete ? 'var(--brand-danger)' : 'var(--brand-success)' }}>{task.is_incomplete ? 'Pending' : 'Done'}</strong></span>
                        <input type="checkbox" checked={task.is_incomplete} onChange={() => state.handleToggleTask(task.id)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    </label>
                </div>
            </div>
            {expandedTaskId === task.id && (
                <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-main)', fontSize: '13px', color: 'var(--text-primary)' }}>
                    <p style={{ margin: '0 0 10px 0', lineHeight: 1.6 }}>{task.details}</p>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Created: {task.created_at}</div>
                </div>
                )}
        </div>
    );
};