import React, { useState, useEffect } from "react";
import API from "../api/api";

export default function LeadGeneratorView({ state }) {
    const [companyName, setCompanyName] = useState("");
    const [domain, setDomain] = useState("");
    const [targets, setTargets] = useState([]);
    const [expandedTargetId, setExpandedTargetId] = useState(null);
    const [contactsCache, setContactsCache] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadTargets();
    }, []);

    const loadTargets = async () => {
        try {
            const data = await API.fetchLeadTargets(state.user.access_token);
            setTargets(data);
        } catch (err) {
            state.showErrorModal("Fetch Error", err.message);
        }
    };

    const handleTargetSubmit = async (e) => {
        e.preventDefault();
        if (!domain.includes('.')) {
            state.showErrorModal("Validation Error", "Please enter a valid domain (e.g., reliance.com).");
            return;
        }

        setIsLoading(true);
        try {
            await API.submitLeadTarget({ company_name: companyName, domain }, state.user.access_token);
            setCompanyName("");
            setDomain("");
            await loadTargets();
            if (state.setAlertMessage) {
                state.setAlertMessage("✅ Target company added to the overnight scraping queue.");
                state.setIsAlertOpen(true);
            }
        } catch (err) {
            state.showErrorModal("Submission Failed", err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccordionToggle = async (target) => {
        // Close if already open
        if (expandedTargetId === target.id) {
            setExpandedTargetId(null);
            return;
        }

        setExpandedTargetId(target.id);

        // Only fetch if it's completed and we haven't cached the contacts yet
        if (target.status === 'Completed' && !contactsCache[target.id]) {
            try {
                const contacts = await API.fetchLeadContacts(target.id, state.user.access_token);
                setContactsCache(prev => ({ ...prev, [target.id]: contacts }));
            } catch (err) {
                console.error("Failed to load contacts:", err);
            }
        }
    };

    const handleMockSync = async (e, targetId) => {
        e.stopPropagation(); // Prevent accordion from toggling
        try {
            await API.simulateOvernightSync(targetId, state.user.access_token);
            await loadTargets();
            if (state.setAlertMessage) {
                state.setAlertMessage("🔄 Mock overnight sync completed. Contacts generated.");
                state.setIsAlertOpen(true);
            }
        } catch (err) {
            state.showErrorModal("Simulation Failed", err.message);
        }
    };

    return (
        <div className="frappe-card" style={{ maxWidth: 1000, margin: "0 auto", padding: 25 }}>
            <div className="system-header" style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Lead Generator Engine</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Target enterprise domains during the day; harvest prioritized contacts overnight.
                </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleTargetSubmit} style={{ background: "var(--bg-main)", padding: "20px", borderRadius: "var(--radius-sm)", marginBottom: "30px", border: "1px solid var(--border-light)" }}>
                <h4 style={{ margin: "0 0 15px 0", fontSize: "14px" }}>Queue New Corporate Target</h4>
                <div className="form-grid-layout" style={{ gridTemplateColumns: "2fr 2fr auto", alignItems: "end" }}>
                    <div className="form-group">
                        <label className="input-label">Company Name *</label>
                        <input type="text" required className="form-input" placeholder="e.g. Tata Motors" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Corporate Domain *</label>
                        <input type="text" required className="form-input" placeholder="e.g. tatamotors.com" value={domain} onChange={e => setDomain(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ padding: "10px 20px" }}>
                        {isLoading ? "Queueing..." : "Add to Night Queue"}
                    </button>
                </div>
            </form>

            {/* Target List (Accordion) */}
            <div>
                <h4 style={{ margin: "0 0 15px 0", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
                    Scraping Pipeline
                </h4>
                
                {targets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px dashed var(--border-light)' }}>
                        No targets currently in the pipeline.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {targets.map(target => {
                            const isExpanded = expandedTargetId === target.id;
                            const contacts = contactsCache[target.id] || [];

                            return (
                                <div key={target.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', overflow: 'hidden' }}>
                                    
                                    {/* Accordion Header */}
                                    <div 
                                        onClick={() => handleAccordionToggle(target)}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', cursor: 'pointer', background: isExpanded ? 'var(--bg-main)' : 'transparent' }}
                                    >
                                        <div>
                                            <strong style={{ fontSize: '15px', color: 'var(--brand-accent)' }}>{target.company_name}</strong>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                {target.domain} | Queued: {target.created_at.split('T')[0]}
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            {/* Status Badge */}
                                            <span style={{ 
                                                fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold',
                                                background: target.status === 'Completed' ? '#eaffea' : 'var(--bg-main)',
                                                color: target.status === 'Completed' ? 'var(--brand-success)' : 'var(--text-muted)',
                                                border: `1px solid ${target.status === 'Completed' ? 'var(--brand-success)' : 'var(--border-light)'}`
                                            }}>
                                                {target.status === 'Completed' ? '✅ Harvested' : '⏳ Pending Night Sync'}
                                            </span>

                                            {/* Dev Tool: Simulate Sync */}
                                            {target.status === 'Pending' && (
                                                <button onClick={(e) => handleMockSync(e, target.id)} className="btn-text" style={{ fontSize: '11px' }}>
                                                    [Force Sync]
                                                </button>
                                            )}
                                            
                                            <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--text-muted)' }}>
                                                ▼
                                            </span>
                                        </div>
                                    </div>

                                    {/* Accordion Body (Contacts) */}
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
                                                            <tr key={idx} style={{ 
                                                                borderBottom: '1px solid var(--border-subtle)',
                                                                // Highlight priority contacts with a subtle background
                                                                background: c.is_priority ? 'var(--brand-success)' : 'var(--brand-danger)' 
                                                            }}>
                                                                <td style={{ padding: '10px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <strong>{c.full_name}</strong>
                                                                        {c.is_priority && <span style={{ fontSize: '10px', background: 'var(--brand-accent)', color: 'var(--text-primary)', padding: '2px 6px', borderRadius: '4px' }}>HIGH PRIORITY</span>}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '10px' }}>{c.designation}</td>
                                                                <td style={{ padding: '10px', color: 'var(--brand-accent)' }}>{c.email}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}

                                    {/* Accordion Body (Pending State) */}
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