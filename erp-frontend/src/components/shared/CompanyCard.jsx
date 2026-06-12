import React from "react"
export default function CompanyCard({ company }) {
    return (
        <div key={company.id} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', background: 'var(--combobox-hover)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{company.id}</span>
                <strong style={{ color: 'var(--brand-accent)', fontSize: '15px' }}>{company.name}</strong>
                </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>📍 <strong>Address Vector:</strong> {company.address}</div>
                        <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '6px', marginTop: '4px' }}>
                        👤 <strong>Primary Rep:</strong> {company.contact_name} ({company.contact_role || 'QA/QC'})
                    </div>
                <div>📞 <strong>Secure Line:</strong> {company.contact_phone || 'N/A'}</div>
            </div>
        </div>
    )
}
