import React, { useState } from 'react';
export default function OperatorMultiSelect({ users, selectedEmails, onChange, }) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Prioritize StartsWith, then Contains
    const filteredUsers = users.filter(u => {
        const query = search.toLowerCase();
        const name = u.name.toLowerCase();
        return name.startsWith(query) || name.includes(query);
    }).sort((a, b) => {
        const query = search.toLowerCase();
        if (a.name.toLowerCase().startsWith(query) && !b.name.toLowerCase().startsWith(query)) return -1;
        return 0;
    });

    const toggleUser = (email) => {
        if (selectedEmails.includes(email)) {
            onChange(selectedEmails.filter(e => e !== email));
        } else {
            onChange([...selectedEmails, email]);
        }
    };

    return (
        <div style={{ position: 'relative', flex: 1 }}>
            <div 
                className="form-input" 
                style={{ minHeight: '38px', cursor: 'text', display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px' }} 
                onClick={() => setIsOpen(true)}
            >
                {selectedEmails.map(email => {
                    const u = users.find(x => x.email === email);
                    return (
                        <span key={email} style={{ background: 'var(--brand-accent)', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                            {u ? u.name : email} 
                            <span onClick={(e) => { e.stopPropagation(); toggleUser(email); }} style={{ marginLeft: '4px', cursor: 'pointer', fontWeight: 'bold' }}>×</span>
                        </span>
                    );
                })}
                <input 
                    type="text" 
                    placeholder={selectedEmails.length === 0 ? "Search & Assign Operators..." : ""}
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', flex: 1, minWidth: '120px' }}
                    onFocus={() => setIsOpen(true)}
                />
            </div>
            {isOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', maxHeight: '150px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    {filteredUsers.length === 0 ? <div style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>No operators found.</div> : null}
                    {filteredUsers.map(u => (
                        <div 
                            key={u.email} 
                            onClick={() => toggleUser(u.email)}
                            style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', background: selectedEmails.includes(u.email) ? 'var(--combobox-hover)' : 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <input type="checkbox" checked={selectedEmails.includes(u.email)} readOnly />
                            <div>
                                <strong>{u.name}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({u.role})</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Click-away backdrop overlay */}
            {isOpen && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setIsOpen(false)} />}
        </div>
    );
}
