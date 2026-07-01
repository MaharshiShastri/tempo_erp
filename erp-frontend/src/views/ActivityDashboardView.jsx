import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function ActivityDashboardView({ state }) {
    const [treeData, setTreeData] = useState({ past: [], ongoing: [], future: [] });
    const [loading, setLoading] = useState(true);
    const [openSection, setOpenSection] = useState('ongoing'); 
    const [openRows, setOpenRows] = useState(new Set());
    
    // Manual Logging State
    const [manualLogInputs, setManualLogInputs] = useState({});
    const [isSubmittingLog, setIsSubmittingLog] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await API.fetchActivityTree(state.user.access_token);
            setTreeData(data);
        } catch (err) {
            state.setAlertMessage(err.message);
            state.setIsAlertOpen(true);
        } finally {
            setLoading(false);
        }
    };

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
            await API.addManualActivityLog(orderId, { message }, state.user.access_token);
            setManualLogInputs(prev => ({ ...prev, [orderId]: "" }));
            state.addToast("Activity manually logged.", "success");
            await loadData();
        } catch (err) {
            state.showErrorModal("Logging Failed", err.message);
        } finally {
            setIsSubmittingLog(false);
        }
    };

    const handleDeleteLog = async (logId) => {
        if (state.user.role !== 'Admin' && state.user.role !== 'Chief Full Stack Developer') {
            state.showErrorModal("Unauthorized", "Only System Administrators can alter the audit trail.");
            return;
        }

        if (!window.confirm("WARNING: Deleting an audit log alters the immutable history of this order. Proceed?")) return;

        try {
            await API.deleteActivityLog(logId, state.user.access_token);
            state.addToast("Audit log wiped.", "success");
            await loadData();
        } catch (err) {
            state.showErrorModal("Deletion Failed", err.message);
        }
    };

    const renderSection = (title, sectionKey, dataArray, colorVar) => {
        const isOpen = openSection === sectionKey;
        
        return (
            <div style={{ marginBottom: '15px', border: `1px solid var(--border-light)`, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div onClick={() => toggleSection(sectionKey)} style={{ background: isOpen ? 'var(--combobox-hover)' : 'var(--bg-surface)', padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isOpen ? '1px solid var(--border-light)' : 'none', borderLeft: `4px solid var(${colorVar})` }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>
                        {title} <span style={{ opacity: 0.6, fontSize: '12px', marginLeft: '8px' }}>({dataArray.length})</span>
                    </h3>
                    <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                </div>

                {isOpen && (
                    <div style={{ background: 'var(--bg-surface)', padding: '10px' }}>
                        {dataArray.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No orders in this category.</div>
                        ) : (
                            dataArray.map(order => {
                                const isRowOpen = openRows.has(order.order_acceptance_id);
                                return (
                                    <div key={order.order_acceptance_id} style={{ marginBottom: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                                        <div onClick={() => toggleRow(order.order_acceptance_id)} style={{ padding: '12px 15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isRowOpen ? 'var(--bg-main)' : 'transparent', borderBottom: isRowOpen ? '1px solid var(--border-subtle)' : 'none' }}>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--combobox-hover)', padding: '3px 8px', borderRadius: '4px' }}>
                                                    {order.order_acceptance_id.substring(0, 8)}...
                                                </span>
                                                <strong style={{ fontSize: '13px' }}>{order.billing_name}</strong>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Due: {order.due_date}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '11px', color: 'var(--brand-accent)', background: 'rgba(36, 144, 239, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                                                    {order.logs.length} Updates
                                                </span>
                                                <span style={{ transform: isRowOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: '10px' }}>▼</span>
                                            </div>
                                        </div>

                                        {isRowOpen && (
                                            <div style={{ padding: '15px', background: 'var(--bg-surface)' }}>
                                                
                                                {/* Manual Log Entry Area */}
                                                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                                    <input 
                                                        type="text" 
                                                        className="form-input" 
                                                        placeholder="Log manual activity or note..." 
                                                        style={{ fontSize: '12px', padding: '6px 10px' }}
                                                        value={manualLogInputs[order.order_acceptance_id] || ""}
                                                        onChange={e => setManualLogInputs(prev => ({ ...prev, [order.order_acceptance_id]: e.target.value }))}
                                                    />
                                                    <button 
                                                        className="btn btn-secondary" 
                                                        disabled={isSubmittingLog || !manualLogInputs[order.order_acceptance_id]?.trim()} 
                                                        onClick={() => handleAddManualLog(order.order_acceptance_id)}
                                                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <FiPlus /> Add Log
                                                    </button>
                                                </div>

                                                {/* Logs List */}
                                                {order.logs.length === 0 ? (
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No activity logged for this order yet.</div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {order.logs.map(log => (
                                                            <div key={log.log_id} style={{ display: 'flex', gap: '10px', fontSize: '12px', position: 'relative', group: 'logRow' }}>
                                                                <div style={{ minWidth: '60px', color: 'var(--text-muted)', fontSize: '11px', paddingTop: '2px' }}>
                                                                    {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                                </div>
                                                                <div style={{ borderLeft: '2px solid var(--border-subtle)', paddingLeft: '10px', flex: 1 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                        <strong style={{ color: 'var(--brand-accent)' }}>{log.operator_name || log.operator_email}</strong>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                            <span style={{ fontSize: '10px', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>{log.log_type}</span>
                                                                            
                                                                            {/* Only show trash can for admins */}
                                                                            {(state.user.role === 'Admin' || state.user.role === 'Chief Full Stack Developer') && (
                                                                                <button className="btn-text-danger" onClick={() => handleDeleteLog(log.log_id)} style={{ padding: 0 }} title="Delete Audit Record">
                                                                                    <FiTrash2 size={12} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{log.message}</div>
                                                                    
                                                                    {log.metadata && (
                                                                        <div style={{ marginTop: '8px', padding: '8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', color: '#92400e', fontFamily: 'monospace' }}>
                                                                            📦 Material Block: {log.metadata.qty}x {log.metadata.item_code}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Dashboard Telemetry...</div>;

    return (
        <div className="frappe-card">
            <div className="system-header">
                <h3>Shop Floor Accountability Hub</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Audit trails, manual logging, and historical progression.</p>
            </div>
            
            <div style={{ marginTop: '20px' }}>
                {renderSection('Work-in-Progress (WIP)', 'ongoing', treeData.ongoing, '--brand-accent')}
                {renderSection('Order Pipeline', 'future', treeData.future, '--brand-danger')}
                {renderSection('Archived / Completed', 'past', treeData.past, '--brand-success')}
            </div>
        </div>
    );
}